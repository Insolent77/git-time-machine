export type ArchiveErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'ARCHIVE_TOO_LARGE'
  | 'CORRUPT_ARCHIVE'
  | 'ENCRYPTED_ARCHIVE'
  | 'EMPTY_ARCHIVE'
  | 'TOO_MANY_FILES'
  | 'NO_ANALYZABLE_FILES'
  | 'ENTRY_READ_FAILED'
  | 'WASM_ASSETS_MISSING'
  | 'BROWSER_UNSUPPORTED'
  | 'OUT_OF_MEMORY'
  | 'UNKNOWN'

export class ArchiveAnalysisError extends Error {
  readonly code: ArchiveErrorCode
  readonly archiveName: string
  readonly technical?: string
  readonly path?: string

  constructor(options: {
    code: ArchiveErrorCode
    archiveName: string
    message: string
    technical?: string
    path?: string
    cause?: unknown
  }) {
    super(options.message, { cause: options.cause })
    this.name = 'ArchiveAnalysisError'
    this.code = options.code
    this.archiveName = options.archiveName
    this.technical = options.technical
    this.path = options.path
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function normalizeArchiveError(error: unknown, archiveName: string): ArchiveAnalysisError {
  if (error instanceof ArchiveAnalysisError) return error

  const message = errorMessage(error)
  const normalized = message.toLowerCase()

  if (normalized.includes('memory') || normalized.includes('allocation')) {
    return new ArchiveAnalysisError({
      code: 'OUT_OF_MEMORY',
      archiveName,
      message: 'The browser ran out of memory while extracting this archive.',
      technical: message,
      cause: error,
    })
  }

  if (normalized.includes('worker') || normalized.includes('wasm') || normalized.includes('fetch')) {
    return new ArchiveAnalysisError({
      code: 'WASM_ASSETS_MISSING',
      archiveName,
      message: 'The multi-format archive engine could not start.',
      technical: message,
      cause: error,
    })
  }

  return new ArchiveAnalysisError({
    code: 'UNKNOWN',
    archiveName,
    message: 'An unexpected error occurred while reading the archive.',
    technical: message,
    cause: error,
  })
}
