import { fileURLToPath } from 'node:url'
import { discoverProject } from './project.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

try {
  console.log(JSON.stringify(await discoverProject(root), null, 2))
} catch (error) {
  console.error(`Cannot inspect project: ${error.message}`)
  process.exitCode = 1
}
