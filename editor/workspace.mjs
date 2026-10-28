import { relative, resolve, sep } from 'node:path'
import { realpath } from 'node:fs/promises'
import { Worker } from 'node:worker_threads'
import { discoverProject } from './project.mjs'

/** Own one isolated deck worker; a failed open keeps the active deck usable. */
export class EditorWorkspace {
  constructor(root, { onLayouts = () => {}, onDiagnostic = console.error } = {}) {
    this.root = root
    this.onLayouts = onLayouts
    this.onDiagnostic = onDiagnostic
    this.active = null
    this.closed = false
  }

  async library() { return (await discoverProject(this.root)).presentations }

  async open(path, { initialImage = false } = {}) {
    if (this.closed) throw new Error('The workspace is closed')
    const project = await discoverProject(this.root)
    const deck = project.presentations.find(item => item.path === path)
    if (!deck) throw new Error('This presentation is no longer registered. Refresh the library.')
    const entry = await realpath(resolve(this.root, deck.path))
    const root = await realpath(this.root)
    const local = relative(root, entry)
    if (local === '..' || local.startsWith(`..${sep}`) || resolve(root, local) !== entry)
      throw new Error('The presentation must be inside this project')
    const worker = new Worker(new URL('./deck-worker.mjs', import.meta.url), { workerData: { root, entry, project, deck, initialImage } })
    const active = { worker, pending: new Map(), nextId: 0 }
    let startupTimer
    const ready = new Promise((accept, reject) => {
      const fail = error => {
        reject(error)
        for (const pending of active.pending.values()) pending.reject(error)
        active.pending.clear()
      }
      startupTimer = setTimeout(() => { fail(new Error('Opening the presentation timed out')); worker.terminate() }, 60_000)
      worker.on('message', message => {
        if (message.type === 'ready') { clearTimeout(startupTimer); accept(message.snapshot) }
        else if (message.type === 'startup-error') { clearTimeout(startupTimer); fail(new Error(message.message)) }
        else if (message.type === 'layouts-changed') { if (this.active === active) this.onLayouts(active) }
        else {
          const pending = active.pending.get(message.id)
          if (!pending) return
          active.pending.delete(message.id)
          if (message.ok) pending.resolve(message.result)
          else pending.reject(new Error(message.message))
        }
      })
      worker.on('error', fail)
      worker.on('exit', code => {
        clearTimeout(startupTimer)
        fail(new Error(`Presentation worker stopped (${code})`))
      })
    })
    try {
      active.snapshot = await ready
      if (this.closed) throw new Error('The workspace is closed')
      const previous = this.active
      this.active = active
      if (previous) await this.stop(previous)
      return active.snapshot
    } catch (error) { await worker.terminate(); throw error }
  }

  call(active, request) {
    return new Promise((resolve, reject) => {
      const id = ++active.nextId
      active.pending.set(id, { resolve, reject })
      try { active.worker.postMessage({ ...request, id }) }
      catch (error) { active.pending.delete(id); reject(error) }
    })
  }

  async refreshLayouts(active = this.active) {
    if (!active || active !== this.active) return null
    const result = await this.call(active, { action: 'layouts' })
    for (const diagnostic of result.diagnostics)
      this.onDiagnostic(`Layout metadata: ${diagnostic.path}: ${diagnostic.message}`)
    return result
  }

  async request(request) {
    if (request.action === 'open') return { project: await this.open(request.path), message: 'Opened presentation' }
    if (request.action === 'library') return { library: await this.library(), message: 'Library refreshed' }
    if (!['save', 'undo', 'redo', 'reload'].includes(request.action)) throw new Error('Unsupported editor action')
    if (!this.active) throw new Error('No presentation is open')
    return this.call(this.active, request)
  }

  async stop(active) {
    // Give Vite a chance to release its file watchers and sockets, then ensure
    // dependencies with lingering handles cannot keep an old worker alive.
    let timer
    try { await Promise.race([this.call(active, { action: 'close' }), new Promise(resolve => { timer = setTimeout(resolve, 3000) })]) }
    catch (error) { this.onDiagnostic(`Preview shutdown: ${error.message}`) }
    finally { clearTimeout(timer); await active.worker.terminate() }
  }

  async close() {
    this.closed = true
    const active = this.active
    this.active = null
    if (active) await this.stop(active)
  }
}
