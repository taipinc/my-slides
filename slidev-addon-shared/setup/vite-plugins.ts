import { resolve } from 'node:path'
import { cp, access } from 'node:fs/promises'

/**
 * Copies `images/` from the slide entry's directory into the build output
 * so that relative `./images/…` paths in frontmatter resolve after build.
 */
export default function (options: { userRoot: string }) {
  let resolvedOutDir = ''

  return {
    name: 'slidev-copy-slide-images',
    configResolved(config: { build: { outDir: string }; root: string }) {
      // outDir may be relative – resolve it against Vite's root
      resolvedOutDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const srcImages = resolve(options.userRoot, 'images')
      try {
        await access(srcImages)
      } catch {
        return // no images/ folder – nothing to do
      }
      await cp(srcImages, resolve(resolvedOutDir, 'images'), { recursive: true })
    },
  }
}
