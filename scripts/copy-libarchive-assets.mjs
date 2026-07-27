import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'node_modules/libarchive.js/dist')
const target = resolve(root, 'public/libarchive')

await mkdir(target, { recursive: true })

for (const file of ['worker-bundle.js', 'libarchive.wasm']) {
  try {
    await copyFile(resolve(source, file), resolve(target, file))
  } catch (error) {
    console.error(`Could not copy ${file} from libarchive.js. Run npm install before building.`)
    throw error
  }
}

console.log('libarchive.js browser assets prepared.')
