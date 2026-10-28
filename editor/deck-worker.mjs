import { parentPort, workerData } from 'node:worker_threads'
import { dirname, join } from 'node:path'
import { realpath } from 'node:fs/promises'
import { DeckSession } from './deck.mjs'
import { createPreview } from './preview.mjs'
import { watchLayouts } from './layouts.mjs'

// Slidev caches its first entry's roots in module state. Each worker gets its own
// module instance, so decks in different directories never share that cache.
let server
let stopWatching
let queue = Promise.resolve()
try {
  const { root, entry, project, deck, initialImage } = workerData
  const preview = await createPreview(entry)
  const { options } = preview
  server = preview.server
  const session = new DeckSession({ root, entry, userRoot: options.userRoot, project, getLayouts: options.utils.getLayouts })
  const state = await session.reload()
  if (!state.slides.length) throw new Error('The selected deck has no visible slides')
  await server.listen()
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') throw new Error('Slidev did not open a TCP port')
  stopWatching = watchLayouts(server, options.roots, () => parentPort.postMessage({ type: 'layouts-changed' }))
  parentPort.on('message', request => {
    queue = queue.then(async () => {
      try {
        let result
        if (request.action === 'save') result = await session.save(request)
        else if (request.action === 'undo' || request.action === 'redo') result = await session.history(request.action, request.revision)
        else if (request.action === 'reload') result = { ...await session.reload(), message: 'Reloaded from disk' }
        else if (request.action === 'layouts') {
          const previous = JSON.stringify(session.layouts.map(layout => [layout.id, layout.component]))
          result = await session.refreshLayouts()
          if (previous !== JSON.stringify(result.layouts.map(layout => [layout.id, layout.component]))) {
            server.moduleGraph.invalidateAll()
            server.hot.send({ type: 'full-reload' })
          }
        } else if (request.action === 'close') {
          stopWatching()
          await server.close()
          parentPort.postMessage({ id: request.id, ok: true })
          parentPort.close()
          return
        } else throw new Error('Unsupported deck action')
        parentPort.postMessage({ id: request.id, ok: true, result })
      } catch (error) { parentPort.postMessage({ id: request.id, ok: false, message: error.message }) }
    })
  })
  parentPort.postMessage({ type: 'ready', snapshot: {
    version: 1, deck, library: project.presentations,
    origin: `http://127.0.0.1:${address.port}`,
    route: options.data.config.routerMode === 'hash' ? 'hash' : 'history',
    initialSlide: initialImage ? state.slides.find(slide => slide.layout === 'image-caption')?.number ?? 1 : 1,
    imageDirectory: await realpath(join(dirname(entry), 'images')).catch(() => ''),
    ...state,
  } })
} catch (error) {
  stopWatching?.()
  await server?.close()
  parentPort.postMessage({ type: 'startup-error', message: error.message })
  parentPort.close()
}
