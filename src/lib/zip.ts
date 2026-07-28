import JSZip, { type JSZipObject } from 'jszip'
import { Archive } from 'libarchive.js'
import { ArchiveAnalysisError, normalizeArchiveError } from './archive-errors'
import type { CapturePrecision, FileAnalysisRole, Snapshot, SnapshotFile, SnapshotProfile } from './types'

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
  '.git', '.idea', '.vscode', '.codebase-memory', '.continue', '.cursor', 'node_modules', 'vendor', 'dist', 'build', 'coverage', '.next', '.nuxt', '.cache', '__pycache__',
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
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.htaccess', '.bash_history',
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

type LibarchiveProgressEntry = {
  path?: string
  file: {
    name?: string
  }
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
  const normalized = path.toLowerCase()
  const segments = normalized.split('/')
  const hostingNoise = normalized === '.bash_history'
    || normalized === 'tmp'
    || normalized.startsWith('tmp/')
    || normalized === 'logs'
    || normalized.startsWith('logs/')
    || normalized.startsWith('php-bin/')
    || normalized.startsWith('php-bin-')
    || /^email\/[^/]+\/.*\/\.maildir(?:\/|$)/.test(normalized)
    || normalized.includes('/storage/logs/')
    || normalized.endsWith('/storage/logs')

  return hostingNoise
    || segments.some((segment) => IGNORED_SEGMENTS.has(segment))
    || normalized.endsWith('.map')
    || normalized.includes('/.git/')
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
      const blobBuffer = new ArrayBuffer(bytes.byteLength)
      new Uint8Array(blobBuffer).set(bytes)
      output.push({ path, blob: new Blob([blobBuffer]), modifiedAt: entry.date?.toISOString() })
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

    const extracted = await archive.extractFiles((entry: LibarchiveProgressEntry) => {
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


const IDENTITY_STOPWORDS = new Set([
  'www', 'admin', 'dev', 'test', 'stage', 'staging', 'local', 'localhost', 'com', 'ru', 'net', 'org', 'io', 'app', 'site',
  'sslip', 'example', 'project', 'release', 'source', 'desktop', 'files', 'django', 'assets', 'static', 'public', 'index',
  'api', 'client', 'server', 'application', 'website', 'readme', 'install', 'setup', 'version', 'windows', 'linux',
  'google', 'googleapis', 'gstatic', 'jsdelivr', 'cloudflare', 'cloudfront', 'unpkg', 'npmjs', 'github', 'githubusercontent',
  'telegram', 'bootstrapcdn', 'jquery', 'microsoft', 'apple', 'yandex', 'schema', 'w3', 'fonts', 'cdn',
])

function browserExportRoots(paths: string[]): string[] {
  const rootHtml = paths.filter((path) => !path.includes('/') && /\.html?$/i.test(path))
  return rootHtml
    .map((path) => path.replace(/\.html?$/i, ''))
    .filter((stem) => paths.some((path) => path.startsWith(`${stem}_files/`)))
}

function isThirdPartyOrGenerated(path: string): boolean {
  const normalized = path.toLowerCase()
  const fileName = normalized.split('/').at(-1) ?? normalized
  return /(?:^|\/)(?:static\/admin|vendor|vendors|libs?|third[_-]?party)(?:\/|$)/i.test(normalized)
    || /\.min(?:\.[a-f0-9]{6,})?\.(?:js|css)$/i.test(fileName)
    || /\.[a-f0-9]{8,}\.(?:js|css)$/i.test(fileName)
    || /(?:jquery|select2|xregexp|moment(?:-timezone)?|imask|nested_admin|relatedobjectlookups|datetimeShortcuts|urlify|prepopulate|nav_sidebar|dark_mode|responsive)\b/i.test(fileName)
}

function analysisRoleForPath(path: string, browserRoots: string[]): FileAnalysisRole {
  const normalized = path.toLowerCase()
  const browserRoot = browserRoots.find((root) => path === `${root}.html` || path === `${root}.htm` || path.startsWith(`${root}_files/`))
  if (browserRoot) {
    if (path === `${browserRoot}.html` || path === `${browserRoot}.htm`) return 'artifact'
    return 'third_party'
  }
  if (isThirdPartyOrGenerated(path)) return 'generated'
  if (/\/(?:compiled|generated|cache)(?:\/|$)/i.test(normalized)) return 'generated'
  if (/(?:^|\/)uploads?\//i.test(normalized) && !/\.htaccess$/i.test(normalized)) return 'generated'
  if (/(?:\.bak|\.old|\.orig|\.tmp|~)$/i.test(normalized) || /(?:^|\/)\.previous-/i.test(normalized)) return 'generated'
  return 'source'
}

function normalizeIdentityToken(value: string): string | undefined {
  const normalized = value.toLowerCase().replace(/^www\./, '').replace(/[^a-zа-яё0-9_-]+/giu, '-').replace(/^-+|-+$/g, '')
  if (normalized.length < 4 || /^\d+$/.test(normalized) || IDENTITY_STOPWORDS.has(normalized)) return undefined
  return normalized
}

function extractIdentityTokens(files: Record<string, SnapshotFile>): string[] {
  const tokens = new Set<string>()
  const text = Object.values(files)
    .filter((file) => file.kind === 'text' && file.content && (file.analysisRole === 'source' || file.analysisRole === 'artifact'))
    .slice(0, 80)
    .map((file) => file.content!.slice(0, 80_000))
    .join('\n')
  const searchable = `${Object.keys(files).join('\n')}\n${text}`

  for (const match of searchable.matchAll(/(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?/gi)) {
    const host = match[1].toLowerCase()
    for (const label of host.split('.')) {
      const token = normalizeIdentityToken(label)
      if (token) tokens.add(token)
    }
  }

  for (const [path, file] of Object.entries(files)) {
    const fileName = path.split('/').at(-1) ?? path
    if (/package\.json$/i.test(fileName) && file.content) {
      try {
        const parsed = JSON.parse(file.content) as { name?: string }
        const token = parsed.name ? normalizeIdentityToken(parsed.name.replace(/^@[^/]+\//, '')) : undefined
        if (token) tokens.add(token)
      } catch { /* malformed manifest */ }
    }
    if (/\.(?:dll|exe|jar)$/i.test(fileName)) {
      const token = normalizeIdentityToken(fileName.replace(/\.[^.]+$/, '').replace(/\.(?:api|core|client|server)$/i, ''))
      if (token) tokens.add(token)
    }
  }

  return [...tokens].sort().slice(0, 24)
}

function buildSnapshotProfile(files: Record<string, SnapshotFile>, browserRoots: string[]): SnapshotProfile {
  const values = Object.values(files)
  const count = (role: FileAnalysisRole) => values.filter((file) => (file.analysisRole ?? 'source') === role).length
  const sourceFiles = count('source')
  const artifactFiles = count('artifact')
  const thirdPartyFiles = count('third_party')
  const generatedFiles = count('generated')
  const binaryFiles = values.filter((file) => file.kind === 'binary').length
  let kind: SnapshotProfile['kind'] = 'source'
  if (browserRoots.length) kind = 'browser_export'
  else if (binaryFiles >= 2 && values.filter((file) => (file.analysisRole ?? 'source') === 'source' && file.kind === 'text').length <= 3 && values.some((file) => /(?:readme|install)/i.test(file.path))) kind = 'binary_package'
  else if (thirdPartyFiles + generatedFiles > sourceFiles) kind = 'mixed'

  const warnings: string[] = []
  if (kind === 'browser_export') warnings.push('The archive looks like pages saved by a browser, not a source-code snapshot.')
  if (thirdPartyFiles || generatedFiles) warnings.push(`${thirdPartyFiles + generatedFiles} generated or third-party files are excluded from semantic code claims.`)
  if (kind === 'binary_package') warnings.push('The archive is mainly a compiled binary package; source-code behavior cannot be reconstructed from binaries.')

  return {
    kind,
    identityTokens: extractIdentityTokens(files),
    sourceFiles,
    artifactFiles,
    thirdPartyFiles,
    generatedFiles,
    binaryFiles,
    warnings,
  }
}

async function entriesToSnapshot(
  file: File,
  entries: RawArchiveEntry[],
  options: {
    label?: string
    capturedAt?: string
    onProgress?: (progress: ArchiveProgress) => void
    capturePrecision?: CapturePrecision
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
  const detectedBrowserRoots = browserExportRoots(candidates.map((entry) => entry.path))

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
      analysisRole: analysisRoleForPath(entry.path, detectedBrowserRoots),
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
    capturePrecision: options.capturePrecision ?? 'datetime',
    profile: buildSnapshotProfile(files, detectedBrowserRoots),
  }
}

export async function parseProjectArchive(
  file: File,
  options: {
    label?: string
    capturedAt?: string
    onProgress?: (progress: ArchiveProgress) => void
    capturePrecision?: CapturePrecision
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
