import JSZip from 'jszip'
import type { Snapshot, SnapshotFile } from './types'

const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024
const MAX_FILE_BYTES = 12 * 1024 * 1024
const MAX_TEXT_BYTES = 1.5 * 1024 * 1024
const MAX_FILES = 6000

const PROJECT_ROOT_SEGMENTS = new Set([
  'src', 'app', 'public', 'assets', 'docs', 'test', 'tests', 'config', 'scripts', 'api', 'server', 'client',
])

const IGNORED_SEGMENTS = new Set([
  '.git',
  '.idea',
  '.vscode',
  'node_modules',
  'vendor',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '__pycache__',
])

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'mdx', 'json', 'jsonc', 'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'css', 'scss', 'sass', 'less', 'html', 'htm', 'xml', 'svg', 'vue', 'svelte',
  'py', 'php', 'rb', 'go', 'rs', 'java', 'kt', 'kts', 'cs', 'cpp', 'c', 'h', 'hpp',
  'sql', 'graphql', 'gql', 'yaml', 'yml', 'toml', 'ini', 'conf', 'config', 'env',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd', 'dockerfile', 'gitignore',
  'editorconfig', 'properties', 'gradle', 'lock', 'csv', 'tsv',
])

const TEXT_FILENAMES = new Set([
  'dockerfile', 'makefile', 'license', 'readme', 'changelog', 'composer.json',
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
])

export interface ArchiveProgress {
  archive: string
  processed: number
  total: number
  currentPath?: string
}

function sanitizePath(value: string): string {
  return value
    .replaceAll('\\', '/')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/')
}

function shouldIgnore(path: string): boolean {
  const segments = path.toLowerCase().split('/')
  return segments.some((segment) => IGNORED_SEGMENTS.has(segment))
    || path.endsWith('.map')
    || path.includes('/.git/')
}

function isTextPath(path: string): boolean {
  const fileName = path.split('/').at(-1)?.toLowerCase() ?? ''
  if (TEXT_FILENAMES.has(fileName)) return true
  const extension = fileName.includes('.') ? fileName.split('.').at(-1) ?? '' : fileName
  return TEXT_EXTENSIONS.has(extension)
}

function getCommonRoot(paths: string[]): string | undefined {
  if (!paths.length) return undefined
  const firstSegments = paths.map((path) => path.split('/')[0])
  const candidate = firstSegments[0]
  const allNested = paths.every((path) => path.includes('/'))
  const looksLikeProjectDirectory = !PROJECT_ROOT_SEGMENTS.has(candidate.toLowerCase())
  return allNested && looksLikeProjectDirectory && firstSegments.every((segment) => segment === candidate) ? candidate : undefined
}

function stripRoot(path: string, root?: string): string {
  if (!root) return path
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path
}

function estimatedUncompressedSize(entry: unknown): number | undefined {
  const candidate = entry as { _data?: { uncompressedSize?: number } }
  return candidate._data?.uncompressedSize
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const exactBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const digest = await crypto.subtle.digest('SHA-256', exactBuffer)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

function normalizeLabel(fileName: string): string {
  return fileName
    .replace(/\.zip$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function deterministicId(file: File, label: string, capturedAt: string): string {
  const raw = `${file.name}|${file.size}|${file.lastModified}|${label}|${capturedAt}`
  let value = 2166136261
  for (let index = 0; index < raw.length; index += 1) {
    value ^= raw.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return `snapshot-${Math.abs(value >>> 0).toString(36)}`
}

export async function parseZipArchive(
  file: File,
  options: {
    label?: string
    capturedAt?: string
    onProgress?: (progress: ArchiveProgress) => void
  } = {},
): Promise<Snapshot> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error(`«${file.name}» не является ZIP-архивом.`)
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error(`«${file.name}» больше 200 МБ. Для браузерного MVP используйте архив меньшего размера.`)

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(file, { createFolders: false, checkCRC32: false })
  } catch (error) {
    throw new Error(`Не удалось открыть «${file.name}». Зашифрованные и многотомные архивы пока не поддерживаются. ${error instanceof Error ? error.message : ''}`)
  }

  const rawEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => ({ entry, path: sanitizePath(entry.name) }))
    .filter(({ path }) => path)

  if (rawEntries.length > MAX_FILES) throw new Error(`В «${file.name}» больше ${MAX_FILES} файлов. Удалите зависимости и сборочные каталоги из архива.`)

  const commonRoot = getCommonRoot(rawEntries.map(({ path }) => path))
  const candidates = rawEntries
    .map(({ entry, path }) => ({ entry, path: stripRoot(path, commonRoot) }))
    .filter(({ path }) => path && !shouldIgnore(path))

  const files: Record<string, SnapshotFile> = {}
  let totalBytes = 0
  let ignoredCount = rawEntries.length - candidates.length

  for (let index = 0; index < candidates.length; index += 1) {
    const { entry, path } = candidates[index]
    options.onProgress?.({ archive: file.name, processed: index, total: candidates.length, currentPath: path })

    const estimatedSize = estimatedUncompressedSize(entry)
    if (estimatedSize !== undefined && estimatedSize > MAX_FILE_BYTES) {
      ignoredCount += 1
      continue
    }

    const bytes = await entry.async('uint8array')
    if (bytes.byteLength > MAX_FILE_BYTES) {
      ignoredCount += 1
      continue
    }

    const textCandidate = isTextPath(path) && bytes.byteLength <= MAX_TEXT_BYTES
    const content = textCandidate ? new TextDecoder('utf-8', { fatal: false }).decode(bytes) : undefined
    const snapshotFile: SnapshotFile = {
      path,
      size: bytes.byteLength,
      hash: await hashBytes(bytes),
      kind: textCandidate ? 'text' : 'binary',
      modifiedAt: entry.date?.toISOString(),
      ...(content !== undefined ? { content } : {}),
    }

    files[path] = snapshotFile
    totalBytes += bytes.byteLength
  }

  options.onProgress?.({ archive: file.name, processed: candidates.length, total: candidates.length })

  const capturedAt = options.capturedAt ?? new Date(file.lastModified || Date.now()).toISOString()
  const label = options.label?.trim() || normalizeLabel(file.name) || file.name

  return {
    id: deterministicId(file, label, capturedAt),
    label,
    sourceName: file.name,
    capturedAt,
    files,
    totalBytes,
    ignoredCount,
  }
}
