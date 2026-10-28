import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { chmod, copyFile, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import { discoverProject } from './project.mjs'
import { EditorWorkspace } from './workspace.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const nativeDirectory = join(root, 'editor', 'native')
const args = process.argv.slice(2)
const previewOnly = args.includes('--preview-only')
const query = args.filter(arg => arg !== '--preview-only').join(' ').toLowerCase()
let workspace
let child
let runtime
let stopping = false

async function cleanup() {
  if (stopping) return
  stopping = true
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = once(child, 'exit')
    child.kill('SIGTERM')
    const force = setTimeout(() => child.kill('SIGKILL'), 3000)
    try { await exited } finally { clearTimeout(force) }
  }
  await workspace?.close()
  if (runtime) await rm(runtime, { recursive: true, force: true })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    cleanup().then(() => process.exit(signal === 'SIGINT' ? 130 : 143))
  })
}

try {
  if (!previewOnly && process.platform !== 'darwin')
    throw new Error('The native prototype currently supports macOS only')
  const project = await discoverProject(root)
  const matches = query ? project.presentations.filter(deck => `${deck.title} ${deck.path}`.toLowerCase().includes(query)) : []
  if (query && matches.length !== 1)
    throw new Error(`Expected one presentation matching "${query}"; found ${matches.length}. Use a more specific title or path.`)
  const deck = matches[0] ?? project.presentations.find(deck => deck.path.includes('w01-exposure/')) ?? project.presentations[0]
  if (!deck) throw new Error('No presentations are registered')

  if (!previewOnly) {
    child = spawn('cargo', ['build', '--locked', '--manifest-path', join(nativeDirectory, 'Cargo.toml')], { cwd: root, stdio: 'inherit' })
    const [code] = await once(child, 'exit')
    child = null
    if (code !== 0) throw new Error('Native compilation failed; see Cargo output above')
  }

  let queue = Promise.resolve()
  let native
  workspace = new EditorWorkspace(root, { onLayouts(active) {
    queue = queue.then(async () => {
      const result = await workspace.refreshLayouts(active)
      if (result && native?.stdin.writable) native.stdin.write(`${JSON.stringify({ id: 0, ok: true, ...result, message: result.diagnostics.length ? 'Layout metadata needs attention; drafts are retained.' : 'Layouts updated' })}\n`)
    }).catch(error => console.error(`Layout refresh: ${error.message}`))
  } })
  const state = await workspace.open(deck.path, { initialImage: true })
  state.showLibrary = !query && !previewOnly
  const { origin, route, initialSlide, slides } = state
  const previewUrl = route === 'hash' ? `${origin}/?embedded=true#/${initialSlide}` : `${origin}/${initialSlide}?embedded=true`
  console.log(`Preview: ${previewUrl}`)
  console.log(`Deck: ${deck.title} (${slides.length} slides). Inspector edits are written only on Save.`)
  if (previewOnly) {
    console.log('Preview-only mode. Press Ctrl+C to stop.')
  } else {
    runtime = await mkdtemp(join(tmpdir(), 'slide-workspace-'))
    const snapshot = join(runtime, 'project.json')
    await writeFile(snapshot, JSON.stringify(state, null, 2))
    // A development app bundle gives macOS a stable window/application identity.
    const bundle = join(nativeDirectory, 'target', 'debug', 'Slide Workspace.app', 'Contents')
    await mkdir(join(bundle, 'MacOS'), { recursive: true })
    await copyFile(join(nativeDirectory, 'Info.plist'), join(bundle, 'Info.plist'))
    const executable = join(bundle, 'MacOS', 'slide-workspace')
    // Preserve a fresh inode: overwriting a previously launched Mach-O can leave
    // macOS's cached code-signature state attached to the replaced executable.
    const staged = `${executable}-${randomUUID()}`
    await copyFile(join(nativeDirectory, 'target', 'debug', 'slide-workspace'), staged, constants.COPYFILE_FICLONE)
    await chmod(staged, 0o755)
    await rename(staged, executable)
    child = spawn(executable, [snapshot], { cwd: root, stdio: ['pipe', 'pipe', 'inherit'] })
    native = child
    const messages = createInterface({ input: native.stdout })
    messages.on('line', line => {
      queue = queue.then(async () => {
        let request
        try {
          if (line.length > 2_000_000) throw new Error('Edit message is too large')
          request = JSON.parse(line)
          if (!Number.isSafeInteger(request.id)) throw new Error('Invalid request identifier')
          const response = await workspace.request(request)
          if (native.stdin.writable) native.stdin.write(`${JSON.stringify({ id: request.id, ok: true, ...response })}\n`)
        } catch (error) {
          if (native.stdin.writable) native.stdin.write(`${JSON.stringify({ id: request?.id ?? 0, ok: false, message: error.message })}\n`)
        }
      }).catch(error => console.error(`Editor bridge: ${error.message}`))
    })
    native.stdin.on('error', error => { if (error.code !== 'EPIPE') console.error(error.message) })
    const [code] = await once(child, 'exit')
    messages.close()
    await queue
    child = null
    if (code !== 0) process.exitCode = code || 1
    await cleanup()
  }
} catch (error) {
  console.error(`Editor: ${error.message}`)
  await cleanup()
  process.exitCode = 1
}
