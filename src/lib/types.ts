export type FileKind = 'text' | 'binary'
export type ChangeStatus = 'added' | 'modified' | 'removed'
export type ComparisonMode = 'auto' | 'full' | 'patch'
export type ResolvedComparisonMode = 'full' | 'patch'
export type HistoryConfidence = 'low' | 'medium' | 'high'
export type CapturePrecision = 'date' | 'datetime'

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

export type FeatureTag =
  | 'student_cabinet'
  | 'email_code_auth'
  | 'password_auth'
  | 'password_reset'
  | 'session_security'
  | 'contract_access'
  | 'schedule_calendar'
  | 'payments_section'
  | 'homework_section'
  | 'settings_profile'
  | 'database_schema'
  | 'shared_layout'
  | 'mobile_navigation'
  | 'smtp_delivery'
  | 'installation_docs'

export type SemanticOperation = 'added' | 'modified' | 'removed'
export type SemanticCertainty = 'fact' | 'inference'
export type SemanticLevel = 'functional' | 'structural' | 'fallback'

export type SemanticFactCode =
  | 'function'
  | 'class'
  | 'interface'
  | 'type_definition'
  | 'component'
  | 'route'
  | 'api_request'
  | 'database_table'
  | 'database_column'
  | 'database_index'
  | 'database_relation'
  | 'dependency'
  | 'build_script'
  | 'environment_variable'
  | 'test_case'
  | 'documentation_section'
  | 'form'
  | 'input_field'
  | 'user_cabinet'
  | 'contract_section'
  | 'schedule_section'
  | 'payments_section'
  | 'homework_section'
  | 'profile_settings'
  | 'shared_navigation'
  | 'installation_setup'
  | 'logout'
  | 'authentication'
  | 'one_time_code'
  | 'password_security'
  | 'csrf_protection'
  | 'session_security'
  | 'authorization'
  | 'email_delivery'
  | 'file_upload'
  | 'file_download'
  | 'search'
  | 'filtering'
  | 'sorting'
  | 'pagination'
  | 'modal_dialog'
  | 'responsive_layout'
  | 'animation'
  | 'layout_system'
  | 'localization'
  | 'browser_storage'
  | 'caching'
  | 'logging'
  | 'realtime_connection'
  | 'background_worker'
  | 'drag_and_drop'
  | 'validation'
  | 'error_handling'
  | 'json_api'
  | 'redirect_navigation'
  | 'configuration'
  | 'ci_pipeline'
  | 'containerization'
  | 'access_rule'
  | 'code_logic'
  | 'file_content'

export interface SemanticEvidence {
  path: string
  line?: number
  symbol?: string
  excerpt?: string
}

export interface SemanticFact {
  id: string
  code: SemanticFactCode
  operation: SemanticOperation
  certainty: SemanticCertainty
  level: SemanticLevel
  confidence: number
  subject: string
  details?: string[]
  evidence: SemanticEvidence[]
}

export interface SemanticAnalysis {
  facts: SemanticFact[]
  analyzedTextFiles: number
  candidateTextFiles: number
  representedTextFiles: number
  fallbackTextFiles: number
  binaryFiles: number
  detectedLanguages: string[]
  coveragePercent: number
  truncatedFacts: number
  warnings: string[]
}

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
  capturePrecision?: CapturePrecision
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

export interface ScopeAnalysis {
  requestedMode: ComparisonMode
  resolvedMode: ResolvedComparisonMode
  fromFileCount: number
  toFileCount: number
  commonPathCount: number
  unchangedCommonPathCount: number
  modifiedCommonPathCount: number
  fromOnlyPathCount: number
  toOnlyPathCount: number
  overlapOfSmallerSnapshot: number
  removalsReliable: boolean
  ignoredPotentialRemovals: number
  historyConfidence: HistoryConfidence
  historyConfidencePercent: number
  reason: 'manual_full' | 'manual_patch' | 'no_common_paths' | 'low_overlap' | 'partial_snapshot' | 'sufficient_overlap'
}

export interface InferredCommit {
  id: string
  category: ChangeCategory
  categories: ChangeCategory[]
  featureTags: FeatureTag[]
  title: string
  description: string
  confidence: number
  classificationConfidence: number
  changes: FileChange[]
  semantic: SemanticAnalysis
}

export interface VersionTransition {
  id: string
  from: Snapshot
  to: Snapshot
  scope: ScopeAnalysis
  stats: ChangeStats
  changes: FileChange[]
  commits: InferredCommit[]
}

export interface AnalysisReport {
  generatedAt: string
  requestedMode: ComparisonMode
  snapshots: Snapshot[]
  transitions: VersionTransition[]
  totals: ChangeStats & {
    inferredCommits: number
    analyzedFiles: number
    ignoredPotentialRemovals: number
    semanticFacts: number
    semanticCoveragePercent: number
  }
}
