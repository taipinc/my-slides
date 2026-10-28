import { createHash, randomUUID } from 'node:crypto'
import { open, readFile, realpath, rename, stat, unlink } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { parser } from '@slidev/cli'
import { discoverRuntimeLayouts } from './project.mjs'

const digest = buffer => createHash('sha256').update(buffer).digest('hex')
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const inside = (root, path) => path === root || path.startsWith(`${root}${sep}`)

function lineOffsets(source) {
  const offsets = [0]
  for (let index = source.indexOf('\n'); index !== -1; index = source.indexOf('\n', index + 1)) offsets.push(index + 1)
  return offsets
}

/** Patch only changed scalar values, the body, and/or the final notes comment. */
export function patchSlide(source, index, { content, note, fields }) {
  const parsed = parser.parseSync(source, '', { preserveCR: true })
  const slide = parsed.slides[index]
  if (!slide) throw new Error('The source slide no longer exists')
  if (slide.frontmatterDoc?.errors.length) throw new Error('Fix frontmatter YAML errors before saving')
  const offsets = lineOffsets(source)
  const start = offsets[slide.start] ?? source.length
  const end = offsets[slide.end] ?? source.length
  const raw = source.slice(start, end)
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const normalize = value => value.replace(/\r\n?/g, '\n').trim()
  const withEol = value => normalize(value).replace(/\n/g, eol)
  const patches = []
  // Match exactly the two frontmatter forms recognized by the installed parser.
  const header = raw.match(/^---.*\r?\n([\s\S]*?)---/d) ?? raw.match(/^\s*```ya?ml([\s\S]*?)```/d)
  const bodyOffset = header ? header[0].length : 0
  const body = raw.slice(bodyOffset)
  const comments = [...body.matchAll(/<!--([\s\S]*?)-->/g)]
  const last = comments.at(-1)
  const notes = last && !body.slice(last.index + last[0].length).trim() ? last : null
  const bodyArea = notes ? body.slice(0, notes.index) : body
  if (normalize(content) !== normalize(slide.content)) {
    const trimmed = bodyArea.trim()
    let prefix = bodyArea.length - bodyArea.trimStart().length
    // Leave the header's closing delimiter on its own line for an empty body.
    if (!trimmed) prefix = header && bodyArea.startsWith(eol) ? eol.length : 0
    let replacement = withEol(content)
    if (!trimmed && replacement && !bodyArea.slice(prefix).startsWith(eol)) replacement += eol
    patches.push({ start: bodyOffset + prefix, end: bodyOffset + prefix + trimmed.length, text: replacement })
  }
  if (normalize(note) !== normalize(slide.note || '')) {
    if (note.includes('-->') || note.includes('<!--')) throw new Error('Speaker notes cannot contain HTML comment delimiters')
    if (notes) {
      const inner = notes[1]
      const prefix = inner.length - inner.trimStart().length
      patches.push({ start: bodyOffset + notes.index + 4 + prefix, end: bodyOffset + notes.index + 4 + prefix + inner.trim().length, text: withEol(note) })
    } else if (normalize(note)) {
      patches.push({ start: raw.length, end: raw.length, text: `${raw.endsWith(eol) ? '' : eol}${eol}<!--${eol}${withEol(note)}${eol}-->${eol}` })
    }
  }
  const additions = []
  for (const [key, value] of Object.entries(fields)) {
    if (equal(value, slide.frontmatter[key])) continue
    const pair = slide.frontmatterDoc?.contents?.items?.find(pair => pair.key?.value === key)
    if (pair) {
      const node = pair.value
      if (!header || !node?.range || node.items || !['string', 'number', 'boolean'].includes(typeof node.value))
        throw new Error(`Field ${key} uses YAML syntax that requires source editing`)
      const [from, to] = node.range
      const offset = header.indices[1][0]
      const previous = raw.slice(offset + from, offset + to)
      patches.push({ start: offset + from, end: offset + to, text: JSON.stringify(value) + (previous.endsWith(eol) ? eol : '') })
    } else additions.push(`${key}: ${JSON.stringify(value)}${eol}`)
  }
  if (additions.length) {
    if (header) {
      const at = header.indices[1][1]
      patches.push({ start: at, end: at, text: `${raw.slice(0, at).endsWith(eol) ? '' : eol}${additions.join('')}` })
    } else {
      // Fenced YAML uses the existing slide boundary; no duplicate --- separator.
      patches.push({ start: 0, end: 0, text: `\`\`\`yaml${eol}${additions.join('')}\`\`\`${eol}` })
    }
  }
  let updated = raw
  for (const patch of patches.map((patch, order) => ({ ...patch, order })).sort((a, b) => b.start - a.start || b.end - a.end || b.order - a.order))
    updated = updated.slice(0, patch.start) + patch.text + updated.slice(patch.end)
  const result = source.slice(0, start) + updated + source.slice(end)
  const checked = parser.parseSync(result, '', { preserveCR: true })
  const changed = checked.slides[index]
  if (checked.slides.length !== parsed.slides.length || !changed || normalize(changed.content) !== normalize(content) || normalize(changed.note || '') !== normalize(note))
    throw new Error('The edit changes slide boundaries or notes structure. Use a fenced code block for literal slide separators.')
  if (changed.frontmatterDoc?.errors.length || Object.entries(fields).some(([key, value]) => !equal(changed.frontmatter[key], value)))
    throw new Error('The edit produced invalid frontmatter')
  return result
}

/** Session-local history and revision checks. Only directly owned entry slides are writable. */
export class DeckSession {
  constructor({ root, entry, userRoot, project, getLayouts }) {
    this.root = resolve(root)
    this.entry = resolve(entry)
    this.userRoot = userRoot
    this.schemas = new Map(project.layouts.map(layout => [layout.id, layout.editor]))
    this.layouts = project.layouts.map(layout => ({ ...layout, label: layout.editor?.label ?? layout.id }))
    this.getLayouts = getLayouts
    this.undoStack = []
    this.redoStack = []
  }

  async refreshLayouts() {
    if (this.getLayouts) {
      const result = await discoverRuntimeLayouts(await this.getLayouts(), this.root)
      this.layouts = result.layouts
      this.schemas = new Map(result.layouts.map(layout => [layout.id, layout.editor]))
      return result
    }
    return { layouts: this.layouts, diagnostics: [] }
  }

  async read(sources = {}) {
    const files = new Map()
    const data = await parser.load(this.userRoot, this.entry, async path => {
      const canonical = await realpath(path)
      const buffer = sources[canonical] ?? await readFile(canonical)
      files.set(canonical, buffer)
      return buffer.toString('utf8')
    }, 'dev')
    for (const markdown of Object.values(data.markdownFiles)) {
      if (markdown.errors?.length) throw new Error(markdown.errors.map(error => error.message).join('\n'))
    }
    return { data, files }
  }

  async reload() {
    await this.refreshLayouts()
    this.entry = await realpath(this.entry)
    this.root = await realpath(this.root)
    if (!inside(this.root, this.entry)) throw new Error('The deck is outside the project')
    Object.assign(this, await this.read())
    this.undoStack = []
    this.redoStack = []
    return this.state()
  }

  state() {
    const revision = digest([...this.files].map(([path, buffer]) => `${path}:${digest(buffer)}`).sort().join('\n'))
    return {
      revision,
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      layouts: this.layouts,
      slides: this.data.slides.map((slide, index) => ({
        number: index + 1,
        title: slide.title || `Slide ${index + 1}`,
        layout: slide.frontmatter.layout || 'default',
        content: slide.content,
        note: slide.note || '',
        frontmatter: slide.frontmatter,
        editor: this.schemas.get(slide.frontmatter.layout) ?? null,
        editable: !slide.importChain && resolve(slide.source.filepath) === this.entry,
      })),
    }
  }

  async checkRevision(revision) {
    if (revision !== this.state().revision) throw new Error('The app snapshot is outdated. Reload the deck before saving.')
    for (const [path, expected] of this.files) {
      if (!(await readFile(path)).equals(expected))
        throw new Error('The deck changed outside the app. Your draft is retained. Reload from disk to review the external version before saving.')
    }
  }

  async write(buffer) {
    // Validate the entire loaded deck before replacing its source file.
    const next = await this.read({ [this.entry]: buffer })
    const expected = this.files.get(this.entry)
    const mode = (await stat(this.entry)).mode & 0o777
    const temporary = join(dirname(this.entry), `.${randomUUID()}.slide-workspace.tmp`)
    try {
      const file = await open(temporary, 'wx', mode)
      try { await file.writeFile(buffer); await file.sync() } finally { await file.close() }
      if (!(await readFile(this.entry)).equals(expected)) throw new Error('The deck changed while saving. Your draft is retained; reload to review it.')
      await rename(temporary, this.entry)
      Object.assign(this, next)
    } finally {
      await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error })
    }
  }

  async save(request) {
    await this.checkRevision(request.revision)
    const slide = this.data.slides[request.slide - 1]
    if (!slide || slide.importChain || resolve(slide.source.filepath) !== this.entry)
      throw new Error('Imported slides are read-only in this editing milestone')
    if (typeof request.content !== 'string' || typeof request.note !== 'string' || !request.fields || Array.isArray(request.fields) || typeof request.fields !== 'object')
      throw new Error('Invalid slide edit')
    const layout = request.layout ?? slide.frontmatter.layout ?? 'default'
    const changedLayout = layout !== (slide.frontmatter.layout || 'default')
    if (changedLayout && !this.layouts.some(candidate => candidate.id === layout)) throw new Error('The selected layout is no longer available')
    const schema = this.schemas.get(layout)
    if (this.layouts.find(candidate => candidate.id === layout)?.metadataError)
      throw new Error('Fix this layout’s editor metadata before saving. Your draft is retained.')
    const fields = changedLayout ? { layout } : {}
    for (const [key, value] of Object.entries(request.fields)) {
      const field = schema?.fields.find(field => field.key === key)
      if (!field) throw new Error(`Field ${key} is not declared by this layout`)
      if (equal(value, slide.frontmatter[key] ?? field.default ?? '')) continue
      const valid = field.type === 'number' ? typeof value === 'number' && Number.isFinite(value)
        : field.type === 'boolean' ? typeof value === 'boolean'
        : field.type === 'select' ? field.options.includes(value)
        : typeof value === 'string'
      if (!valid) throw new Error(`Invalid value for ${field.label}`)
      if (field.type === 'asset' && value) {
        const images = resolve(dirname(this.entry), 'images')
        if (!value.startsWith('./images/')) throw new Error('Choose an existing file from this presentation’s images folder')
        const path = await realpath(resolve(dirname(this.entry), value))
        if (!inside(await realpath(images), path) || !(await stat(path)).isFile()) throw new Error('The asset must be a file in this deck’s images folder')
        const extension = extname(path).toLowerCase()
        const kind = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'].includes(extension) ? 'video'
          : ['.mp3', '.wav', '.ogg', '.m4a'].includes(extension) ? 'audio'
          : ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.bmp'].includes(extension) ? 'image' : null
        if (!kind || (field.accept && !field.accept.includes(kind))) throw new Error('This asset type is not supported by the selected field')
      }
      fields[key] = value
    }
    const before = this.files.get(this.entry)
    const after = Buffer.from(patchSlide(before.toString('utf8'), slide.source.index, { ...request, fields }))
    if (after.equals(before)) return { ...this.state(), message: 'No changes to save' }
    await this.write(after)
    this.undoStack.push({ before, after })
    if (this.undoStack.length > 50) this.undoStack.shift()
    this.redoStack = []
    return { ...this.state(), message: 'Saved' }
  }

  async history(action, revision) {
    await this.checkRevision(revision)
    const source = action === 'undo' ? this.undoStack : this.redoStack
    const target = action === 'undo' ? this.redoStack : this.undoStack
    const change = source.at(-1)
    if (!change) throw new Error(`Nothing to ${action}`)
    await this.write(action === 'undo' ? change.before : change.after)
    source.pop()
    target.push(change)
    return { ...this.state(), message: action === 'undo' ? 'Undid saved change' : 'Redid saved change' }
  }
}
