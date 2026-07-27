import JSZip, { type JSZipObject } from 'jszip'
import { Archive } from 'libarchive.js'
import { ArchiveAnalysisError, normalizeArchiveError } from './archive-errors'
import type { Snapshot, SnapshotFile } from './types'

const MAX_ARCHIVE_BYTES = 300 * 1024 * 1024
const MAX_FILE_BYTES = 16 * 1024 * 1024
const MAX_TEXT_BYTES = 2 * 1024 * 1024
const MAX_FILES = 8000

export const SUPPORTED_ARCHIVE_EXTENSIONS = [
  '.zip', '.7z', '.rar', '.tar', '.tar.gz', '.tgz', '.gz', '.tar.bz2', '.tbz2', '.bz2', '.tar.xz', '.txz', '.xz',
] as const

export const ARCHIVE_ACCEPT = SUPPORTED_ARCHIVE_EXTENSIONS.join(',')

const PROJECT_ROOT_SEGMENTS = new Set([
  'src', 'app', 'public', 'assets', 'docs', 'test', 'tests', 'config', 'scripts', 'api', 'server', 'client',
])

const IGNORED_SEGMENTS = new Set([
  '.git', '.idea', '.vscode', 'node_modules', 'vendor', 'dist', 'build', 'coverage', '.next', '.nuxt', '.cache', '__pycache__',
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
  stage?: 'opening' | 'extracting' | 'hashing'
}

type RawArchiveEntry = {
  path: string
  blob: Blob
  modifiedAt?: string
}

let libarchiveInitialized = false

function ensureLibarchive(): void {
  if (libarchiveInitialized) return
  if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
    throw new ArchiveAnalysisError({
      code: 'BROWSER_UNSUPPORTED',
      archiveName: '',
      message: 'This browser does not support Web Workers or WebAssembly.',
    })
  }

  const workerUrl = `${import.meta.env.BASE_URL}libarchive/worker-bundle.js`
  Archive.init({ workerUrl })
  libarchiveInitialized = true
}

export function isSupportedArchive(fileName: string): boolean {
  const normalized = fileName.toLowerCase()
  return SUPPORTED_ARCHIVE_EXTENSIONS.some((extension) => normalized.endsWith(extension))
}

export function archiveExtension(fileName: string): string {
  const normalized = fileName.toLowerCase()
  return [...SUPPORTED_ARCHIVE_EXTENSIONS]
    .sort((left, right) => right.length - left.length)
    .find((extension) => normalized.endsWith(extension)) ?? ''
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

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const exactBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const digest = await crypto.subtle.digest('SHA-256', exactBuffer)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

function normalizeLabel(fileName: string): string {
  const extension = archiveExtension(fileName)
  return fileName
    .slice(0, extension ? -extension.length : undefined)
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

function flattenExtractedTree(value: unknown, prefix = '', output: RawArchiveEntry[] = []): RawArchiveEntry[] {
  if (!value || typeof value !== 'object') return output

  for (const [name, child] of Object.entries(value as Record<string, unknown>)) {
    const path = sanitizePath(prefix ? `${prefix}/${name}` : name)
    if (!path) continue

    if (child instanceof Blob) {
      const fileLike = child as File
      output.push({
        path,
        blob: child,
        modifiedAt: typeof fileLike.lastModified === 'number' && fileLike.lastModified > 0
          ? new Date(fileLike.lastModified).toISOString()
          : undefined,
      })
      continue
    }

    flattenExtractedTree(child, path, output)
  }

  return output
}

async function readZipEntries(file: File, onProgress?: (progress: ArchiveProgress) => void): Promise<RawArchiveEntry[]> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(file, { createFolders: false, checkCRC32: false })
  } catch (error) {
    const technical = error instanceof Error ? error.message : String(error)
    const encrypted = /encrypt|password|passphrase/i.test(technical)
    throw new ArchiveAnalysisError({
      code: encrypted ? 'ENCRYPTED_ARCHIVE' : 'CORRUPT_ARCHIVE',
      archiveName: file.name,
      message: encrypted
        ? 'The ZIP archive is password-protected. Password entry is not enabled in this version.'
        : 'The ZIP structure could not be read. The file may be damaged, incomplete, or not actually a ZIP archive.',
      technical,
      cause: error,
    })
  }

  const entries = (Object.values(zip.files) as JSZipObject[]).filter((entry) => !entry.dir)
  const output: RawArchiveEntry[] = []

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const path = sanitizePath(entry.name)
    if (!path) continue
    onProgress?.({ archive: file.name, processed: index, total: entries.length, currentPath: path, stage: 'extracting' })

    try {
      const bytes = await entry.async('uint8array')
      output.push({ path, blob: new Blob([bytes]), modifiedAt: entry.date?.toISOString() })
    } catch (error) {
      throw new ArchiveAnalysisError({
        code: 'ENTRY_READ_FAILED',
        archiveName: file.name,
        path,
        message: `The file “${path}” could not be extracted from the archive.`,
        technical: error instanceof Error ? error.message : String(error),
        cause: error,
      })
    }
  }

  return output
}

async function readMultiFormatEntries(file: File, onProgress?: (progress: ArchiveProgress) => void): Promise<RawArchiveEntry[]> {
  try {
    ensureLibarchive()
    onProgress?.({ archive: file.name, processed: 0, total: 1, stage: 'opening' })
    const archive = await Archive.open(file)
    const encrypted = await archive.hasEncryptedData()
    if (encrypted) {
      throw new ArchiveAnalysisError({
        code: 'ENCRYPTED_ARCHIVE',
        archiveName: file.name,
        message: 'The archive is password-protected. Password entry is not enabled in this version.',
      })
    }

    const extracted = await archive.extractFiles((entry) => {
      onProgress?.({
        archive: file.name,
        processed: 0,
        total: 1,
        currentPath: sanitizePath(entry.path || ('name' in entry.file ? String(entry.file.name) : '')),
        stage: 'extracting',
      })
    })

    return flattenExtractedTree(extracted)
  } catch (error) {
    if (error instanceof ArchiveAnalysisError) throw error
    const normalized = normalizeArchiveError(error, file.name)
    if (normalized.code === 'UNKNOWN') {
      throw new ArchiveAnalysisError({
        code: 'CORRUPT_ARCHIVE',
        archiveName: file.name,
        message: 'The archive engine could not recognize or extract this file. It may be damaged, incomplete, use an unsupported compression method, or have the wrong extension.',
        technical: normalized.technical,
        cause: error,
      })
    }
    throw normalized
  }
}

async function entriesToSnapshot(
  file: File,
  entries: RawArchiveEntry[],
  options: {
    label?: string
    capturedAt?: string
    onProgress?: (progress: ArchiveProgress) => void
  },
): Promise<Snapshot> {
  if (entries.length === 0) {
    throw new ArchiveAnalysisError({
      code: 'EMPTY_ARCHIVE',
      archiveName: file.name,
      message: 'The archive contains no files.',
    })
  }
  if (entries.length > MAX_FILES) {
    throw new ArchiveAnalysisError({
      code: 'TOO_MANY_FILES',
      archiveName: file.name,
      message: `The archive contains ${entries.length} files; the browser limit is ${MAX_FILES}.`,
      technical: 'Remove node_modules, vendor, build, dist, caches, and other generated directories before archiving.',
    })
  }

  const commonRoot = getCommonRoot(entries.map((entry) => entry.path))
  const candidates = entries
    .map((entry) => ({ ...entry, path: stripRoot(entry.path, commonRoot) }))
    .filter((entry) => entry.path && !shouldIgnore(entry.path))

  const files: Record<string, SnapshotFile> = {}
  let totalBytes = 0
  let ignoredCount = entries.length - candidates.length

  for (let index = 0; index < candidates.length; index += 1) {
    const entry = candidates[index]
    options.onProgress?.({ archive: file.name, processed: index, total: candidates.length, currentPath: entry.path, stage: 'hashing' })

    if (entry.blob.size > MAX_FILE_BYTES) {
      ignoredCount += 1
      continue
    }

    let bytes: Uint8Array
    try {
      bytes = new Uint8Array(await entry.blob.arrayBuffer())
    } catch (error) {
      throw new ArchiveAnalysisError({
        code: 'ENTRY_READ_FAILED',
        archiveName: file.name,
        path: entry.path,
        message: `The extracted file “${entry.path}” could not be read.`,
        technical: error instanceof Error ? error.message : String(error),
        cause: error,
      })
    }

    const textCandidate = isTextPath(entry.path) && bytes.byteLength <= MAX_TEXT_BYTES
    const content = textCandidate ? new TextDecoder('utf-8', { fatal: false }).decode(bytes) : undefined
    files[entry.path] = {
      path: entry.path,
      size: bytes.byteLength,
      hash: await hashBytes(bytes),
      kind: textCandidate ? 'text' : 'binary',
      modifiedAt: entry.modifiedAt,
      ...(content !== undefined ? { content } : {}),
    }
    totalBytes += bytes.byteLength
  }

  if (Object.keys(files).length === 0) {
    throw new ArchiveAnalysisError({
      code: 'NO_ANALYZABLE_FILES',
      archiveName: file.name,
      message: 'No analyzable project files remained after exclusions and size limits were applied.',
      technical: `${ignoredCount} entries were ignored. Check whether the archive contains only dependencies, build output, caches, or files larger than 16 MB.`,
    })
  }

  options.onProgress?.({ archive: file.name, processed: candidates.length, total: candidates.length, stage: 'hashing' })
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

export async function parseProjectArchive(
  file: File,
  options: {
    label?: string
    capturedAt?: string
    onProgress?: (progress: ArchiveProgress) => void
  } = {},
): Promise<Snapshot> {
  if (!isSupportedArchive(file.name)) {
    throw new ArchiveAnalysisError({
      code: 'UNSUPPORTED_FORMAT',
      archiveName: file.name,
      message: `Unsupported archive extension. Supported: ${SUPPORTED_ARCHIVE_EXTENSIONS.join(', ')}.`,
    })
  }
  if (file.size > MAX_ARCHIVE_BYTES) {
    throw new ArchiveAnalysisError({
      code: 'ARCHIVE_TOO_LARGE',
      archiveName: file.name,
      message: `The archive is larger than 300 MB (${Math.round(file.size / 1024 / 1024)} MB).`,
      technical: 'Large archives can exhaust browser memory. Remove dependencies and generated folders, then create a smaller archive.',
    })
  }

  const extension = archiveExtension(file.name)
  const entries = extension === '.zip'
    ? await readZipEntries(file, options.onProgress)
    : await readMultiFormatEntries(file, options.onProgress)

  return entriesToSnapshot(file, entries, options)
}
