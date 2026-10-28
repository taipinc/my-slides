import { createServer, parser, resolveOptions } from '@slidev/cli'
import { realpath } from 'node:fs/promises'

/** Keep Slidev's native HMR pipeline active when hosting its dev server via API. */
export async function createPreview(entry) {
  entry = await realpath(entry)
  const options = await resolveOptions({ entry, remote: false }, 'dev')
  options.data.config.editor = false
  const server = await createServer(options, {
    server: { host: '127.0.0.1', port: 0, open: false },
  }, {
    async loadData(sources) {
      const loaded = await parser.load(options.userRoot, options.entry, sources, 'dev')
      const theme = loaded.headmatter.theme === null ? 'none' : loaded.headmatter.theme || 'default'
      if (theme !== options.themeRaw)
        throw new Error('The theme changed externally. Restart the editor to load the new theme.')
      const themeMeta = options.data.themeMeta
      const config = parser.resolveConfig(loaded.headmatter, themeMeta, options.entry)
      config.editor = false
      for (const key of ['addons', 'canvasWidth', 'aspectRatio', 'routerMode']) {
        if (JSON.stringify(config[key]) !== JSON.stringify(options.data.config[key]))
          throw new Error(`The ${key} setting changed externally. Restart the editor to load the new configuration.`)
      }
      return { ...loaded, themeMeta, config }
    },
  })
  return { options, server }
}
