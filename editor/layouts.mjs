import { join } from 'node:path'

/** Coalesce file-save bursts and outlive Slidev's two-second layout-map cache. */
export function watchLayouts(server, roots, refresh) {
  let timer
  const changed = file => {
    const path = file.replaceAll('\\', '/')
    if (!path.includes('/layouts/') || !/\.(vue|js|mjs|ts|mts|editor\.json)$/.test(path)) return
    clearTimeout(timer)
    timer = setTimeout(refresh, 2200)
  }
  server.watcher.add(roots.map(root => join(root, 'layouts')))
  for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, changed)
  return () => {
    clearTimeout(timer)
    for (const event of ['add', 'change', 'unlink']) server.watcher.off(event, changed)
  }
}
