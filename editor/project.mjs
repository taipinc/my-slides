import { readFile, readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const fieldTypes = new Set(['asset', 'number', 'boolean', 'text', 'select'])
const assetTypes = new Set(['image', 'video', 'audio'])
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isLabel = value => typeof value === 'string' && value.trim().length > 0

export function validateEditorMetadata(metadata) {
  if (!isObject(metadata) || metadata.version !== 1)
    throw new Error('Expected editor metadata version 1')
  if (!isLabel(metadata.label) || !Array.isArray(metadata.fields))
    throw new Error('Expected a label and fields array')

  const keys = new Set()
  for (const field of metadata.fields) {
    if (!isObject(field) || !isLabel(field.key) || !isLabel(field.label) || !fieldTypes.has(field.type))
      throw new Error('Each field needs a key, label and supported type')
    if (keys.has(field.key))
      throw new Error(`Duplicate field key: ${field.key}`)
    keys.add(field.key)

    if (field.type === 'select' && (!Array.isArray(field.options) || !field.options.length || !field.options.every(isLabel)))
      throw new Error(`Select field ${field.key} needs string options`)
    if (hasOwn(field, 'accept') && (field.type !== 'asset' || !Array.isArray(field.accept) || !field.accept.length || !field.accept.every(value => assetTypes.has(value))))
      throw new Error(`Invalid asset types for ${field.key}`)
    if (hasOwn(field, 'default')) {
      const value = field.default
      const valid = field.type === 'number' ? typeof value === 'number' && Number.isFinite(value)
        : field.type === 'boolean' ? typeof value === 'boolean'
        : field.type === 'select' ? field.options.includes(value)
        : typeof value === 'string'
      if (!valid)
        throw new Error(`Invalid default for ${field.key}`)
    }
  }

  if (hasOwn(metadata, 'content') && (!isObject(metadata.content) || !isLabel(metadata.content.label) || metadata.content.format !== 'markdown'))
    throw new Error('Content needs a label and markdown format')
}

/** Inspect the exact component map resolved by Slidev, including themes/addons. */
export async function discoverRuntimeLayouts(components, root) {
  const diagnostics = []
  const layouts = []
  for (const [id, component] of Object.entries(components)) {
    const metadataPath = component.replace(/\.[^.]+$/, '.editor.json')
    let editor = null
    let metadataError = false
    try {
      const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
      validateEditorMetadata(metadata)
      editor = metadata
    } catch (error) {
      if (error.code !== 'ENOENT') {
        metadataError = true
        diagnostics.push({ path: relative(root, metadataPath), message: error.message })
      }
    }
    layouts.push({ id, label: editor?.label ?? id, component: relative(root, component), editor, metadataError })
  }
  layouts.sort((a, b) => a.label.localeCompare(b.label))
  return { layouts, diagnostics }
}

/** Read fresh project metadata without importing Vue components or modifying files. */
export async function discoverProject(projectRoot) {
  const root = resolve(projectRoot)
  const manifest = JSON.parse(await readFile(join(root, 'presentations.json'), 'utf8'))
  if (!isObject(manifest) || typeof manifest.base !== 'string' || !Array.isArray(manifest.presentations))
    throw new Error('Invalid presentations.json: expected base and presentations')
  for (const presentation of manifest.presentations) {
    if (!isObject(presentation) || !['path', 'title', 'course', 'semester'].every(key => isLabel(presentation[key])))
      throw new Error('Invalid presentation: expected path, title, course and semester')
  }

  const directory = join(root, 'slidev-addon-shared', 'layouts')
  const entries = await readdir(directory, { withFileTypes: true })
  const filenames = new Set(entries.filter(entry => entry.isFile()).map(entry => entry.name))
  const diagnostics = []
  const layouts = []

  for (const filename of [...filenames].sort()) {
    if (!filename.endsWith('.vue')) continue
    const id = filename.slice(0, -4)
    const schemaPath = join(directory, `${id}.editor.json`)
    let editor = null
    if (filenames.has(`${id}.editor.json`)) {
      try {
        const metadata = JSON.parse(await readFile(schemaPath, 'utf8'))
        validateEditorMetadata(metadata)
        editor = metadata
      } catch (error) {
        diagnostics.push({ path: relative(root, schemaPath), message: error.message })
      }
    }
    layouts.push({ id, component: relative(root, join(directory, filename)), editor })
  }

  for (const filename of [...filenames].sort()) {
    if (filename.endsWith('.editor.json') && !filenames.has(`${filename.slice(0, -12)}.vue`))
      diagnostics.push({ path: relative(root, join(directory, filename)), message: 'Editor metadata has no matching Vue layout' })
  }

  return { base: manifest.base, presentations: manifest.presentations, layouts, diagnostics }
}
