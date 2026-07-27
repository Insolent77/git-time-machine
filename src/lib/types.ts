export type FileKind = 'text' | 'binary'
export type ChangeStatus = 'added' | 'modified' | 'removed'
export type ChangeCategory =
  | 'auth'
  | 'database'
  | 'admin'
  | 'api'
  | 'ui'
  | 'styles'
  | 'tests'
  | 'docs'
  | 'config'
  | 'deps'
  | 'assets'
  | 'other'

export interface SnapshotFile {
  path: string
  size: number
  hash: string
  kind: FileKind
  content?: string
  modifiedAt?: string
}

export interface Snapshot {
  id: string
  label: string
  sourceName: string
  capturedAt: string
  files: Record<string, SnapshotFile>
  totalBytes: number
  ignoredCount: number
}

export interface FileChange {
  path: string
  status: ChangeStatus
  category: ChangeCategory
  binary: boolean
  sizeBefore: number
  sizeAfter: number
  addedLines: number
  removedLines: number
}

export interface ChangeStats {
  filesAdded: number
  filesModified: number
  filesRemoved: number
  linesAdded: number
  linesRemoved: number
}

export interface InferredCommit {
  id: string
  category: ChangeCategory
  title: string
  description: string
  confidence: number
  changes: FileChange[]
}

export interface VersionTransition {
  id: string
  from: Snapshot
  to: Snapshot
  stats: ChangeStats
  changes: FileChange[]
  commits: InferredCommit[]
}

export interface AnalysisReport {
  generatedAt: string
  snapshots: Snapshot[]
  transitions: VersionTransition[]
  totals: ChangeStats & {
    inferredCommits: number
    analyzedFiles: number
  }
}
