import type {
  AnalysisReport,
  ChangeCategory,
  ChangeStats,
  ComparisonMode,
  FeatureTag,
  FileChange,
  HistoryConfidence,
  InferredCommit,
  ResolvedComparisonMode,
  ScopeAnalysis,
  Snapshot,
  SnapshotFile,
  VersionTransition,
} from './types'
import { analyzeSemanticChanges } from './semantic.js'

const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  auth: 'Авторизация и доступ',
  database: 'База данных',
  admin: 'Административная панель',
  api: 'API и серверная логика',
  ui: 'Пользовательский интерфейс',
  styles: 'Стили и адаптивность',
  tests: 'Тесты и контроль качества',
  docs: 'Документация',
  config: 'Конфигурация и инфраструктура',
  deps: 'Зависимости',
  assets: 'Медиа и ресурсы',
  other: 'Прочие изменения',
}

const CATEGORY_PATTERNS: Array<[ChangeCategory, RegExp[]]> = [
  ['auth', [/auth/i, /login/i, /logout/i, /password/i, /session/i, /token/i, /permission/i, /role/i, /доступ/i]],
  ['database', [/migration/i, /schema/i, /database/i, /personal_account/i, /\bdb\b/i, /models?\./i, /entities/i, /repository/i, /\.sql$/i]],
  ['admin', [/admin/i, /dashboard/i, /backoffice/i, /moderation/i]],
  ['tests', [/(^|\/)tests?\//i, /\.spec\./i, /\.test\./i, /__tests__/i, /playwright/i, /cypress/i, /vitest/i, /jest/i]],
  ['docs', [/readme/i, /changelog/i, /docs?\//i, /install/i, /\.md$/i, /license/i]],
  ['deps', [/package-lock\.json$/i, /package\.json$/i, /pnpm-lock/i, /yarn\.lock/i, /composer\.lock/i, /requirements\.txt$/i, /poetry\.lock/i]],
  ['config', [/\.github\//i, /docker/i, /nginx/i, /\.htaccess$/i, /\.env/i, /config/i, /vite\.config/i, /tsconfig/i, /eslint/i, /prettier/i, /\.ya?ml$/i]],
  ['styles', [/\.css$/i, /\.scss$/i, /\.sass$/i, /\.less$/i, /tailwind/i, /styles?\//i]],
  ['ui', [/components?\//i, /pages?\//i, /views?\//i, /templates?\//i, /schedule/i, /homework/i, /payments/i, /settings/i, /contract/i, /\.tsx$/i, /\.jsx$/i, /\.vue$/i, /\.svelte$/i, /\.html$/i]],
  ['assets', [/assets?\//i, /public\//i, /uploads?\//i, /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|webm|pdf|docx|zip)$/i]],
  ['api', [/\/api\//i, /controller/i, /service/i, /route/i, /endpoint/i, /server/i, /backend/i, /\.php$/i]],
]

function stableId(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

export function categorizePath(path: string): ChangeCategory {
  for (const [category, patterns] of CATEGORY_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(path))) return category
  }
  return 'other'
}

function countLines(content?: string): number {
  if (!content) return 0
  return content.split(/\r?\n/).length
}

function lineDelta(before?: string, after?: string): { added: number; removed: number } {
  if (before === after) return { added: 0, removed: 0 }
  if (!before) return { added: countLines(after), removed: 0 }
  if (!after) return { added: 0, removed: countLines(before) }

  const oldLines = before.split(/\r?\n/)
  const newLines = after.split(/\r?\n/)
  const product = oldLines.length * newLines.length

  if (product <= 1_200_000) {
    const previous = new Uint32Array(newLines.length + 1)
    const current = new Uint32Array(newLines.length + 1)

    for (let oldIndex = 1; oldIndex <= oldLines.length; oldIndex += 1) {
      current.fill(0)
      for (let newIndex = 1; newIndex <= newLines.length; newIndex += 1) {
        current[newIndex] = oldLines[oldIndex - 1] === newLines[newIndex - 1]
          ? previous[newIndex - 1] + 1
          : Math.max(previous[newIndex], current[newIndex - 1])
      }
      previous.set(current)
    }

    const common = previous[newLines.length]
    return { added: newLines.length - common, removed: oldLines.length - common }
  }

  const counts = new Map<string, number>()
  for (const line of oldLines) counts.set(line, (counts.get(line) ?? 0) + 1)

  let common = 0
  for (const line of newLines) {
    const available = counts.get(line) ?? 0
    if (available > 0) {
      common += 1
      counts.set(line, available - 1)
    }
  }

  return { added: newLines.length - common, removed: oldLines.length - common }
}

function makeChange(path: string, status: FileChange['status'], before?: SnapshotFile, after?: SnapshotFile): FileChange {
  const isBinary = before?.kind === 'binary' || after?.kind === 'binary'
  const delta = isBinary ? { added: 0, removed: 0 } : lineDelta(before?.content, after?.content)

  return {
    path,
    status,
    category: categorizePath(path),
    binary: isBinary,
    sizeBefore: before?.size ?? 0,
    sizeAfter: after?.size ?? 0,
    addedLines: delta.added,
    removedLines: delta.removed,
  }
}

function summarizeStats(changes: FileChange[]): ChangeStats {
  return changes.reduce<ChangeStats>((stats, change) => {
    if (change.status === 'added') stats.filesAdded += 1
    if (change.status === 'modified') stats.filesModified += 1
    if (change.status === 'removed') stats.filesRemoved += 1
    stats.linesAdded += change.addedLines
    stats.linesRemoved += change.removedLines
    return stats
  }, { filesAdded: 0, filesModified: 0, filesRemoved: 0, linesAdded: 0, linesRemoved: 0 })
}

function comparablePaths(snapshot: Snapshot): string[] {
  return Object.values(snapshot.files)
    .filter((file) => !file.analysisRole || file.analysisRole === 'source' || file.analysisRole === 'artifact')
    .map((file) => file.path)
}

function fallbackIdentityTokens(snapshot: Snapshot): string[] {
  if (snapshot.profile?.identityTokens?.length) return snapshot.profile.identityTokens
  const tokens = new Set<string>()
  const searchable = Object.keys(snapshot.files).join('\n').toLowerCase()
  for (const match of searchable.matchAll(/(?:^|\/)(?:www\.|lk\.|admin\.|dev\.)?([a-z0-9][a-z0-9_-]{3,})\.(?:com|ru|net|org|io|dev|app)(?:\/|$)/g)) {
    tokens.add(match[1])
  }
  return [...tokens]
}

function sharedContentHashes(from: Snapshot, to: Snapshot): number {
  const fromHashes = new Set(Object.values(from.files)
    .filter((file) => (!file.analysisRole || file.analysisRole === 'source') && file.size >= 64)
    .map((file) => file.hash))
  return new Set(Object.values(to.files)
    .filter((file) => (!file.analysisRole || file.analysisRole === 'source') && file.size >= 64 && fromHashes.has(file.hash))
    .map((file) => file.hash)).size
}

function resolveScope(from: Snapshot, to: Snapshot, requestedMode: ComparisonMode): ScopeAnalysis {
  const fromPaths = comparablePaths(from)
  const toPaths = comparablePaths(to)
  const commonPaths = fromPaths.filter((path) => path in to.files)
  const modifiedCommonPathCount = commonPaths.filter((path) => from.files[path].hash !== to.files[path].hash).length
  const unchangedCommonPathCount = commonPaths.length - modifiedCommonPathCount
  const fromOnlyPathCount = fromPaths.length - commonPaths.length
  const toOnlyPathCount = toPaths.length - commonPaths.length
  const smallerCount = Math.max(Math.min(fromPaths.length, toPaths.length), 1)
  const overlapOfSmallerSnapshot = commonPaths.length / smallerCount
  const fromIdentities = new Set(fallbackIdentityTokens(from))
  const sharedIdentityTokens = fallbackIdentityTokens(to).filter((token) => fromIdentities.has(token))
  const sharedContentHashCount = sharedContentHashes(from, to)

  let relationship: ScopeAnalysis['relationship'] = 'unconfirmed'
  let relationshipReason: ScopeAnalysis['relationshipReason'] = 'no_project_evidence'
  let relationshipConfidencePercent = 10

  if (commonPaths.length > 0) {
    relationship = 'related'
    relationshipReason = 'common_paths'
    relationshipConfidencePercent = Math.min(99, 70 + Math.round(overlapOfSmallerSnapshot * 29))
  } else if (sharedIdentityTokens.length > 0) {
    relationship = 'related'
    relationshipReason = 'shared_identity'
    relationshipConfidencePercent = Math.min(96, 78 + sharedIdentityTokens.length * 5)
  } else if (sharedContentHashCount >= 2) {
    relationship = 'related'
    relationshipReason = 'shared_content'
    relationshipConfidencePercent = Math.min(90, 60 + sharedContentHashCount * 5)
  } else if (requestedMode !== 'auto') {
    relationship = 'related'
    relationshipReason = 'manual_override'
    relationshipConfidencePercent = 35
  }

  const comparisonAllowed = relationship === 'related'
  let resolvedMode: ResolvedComparisonMode = 'patch'
  let reason: ScopeAnalysis['reason'] = 'relationship_unconfirmed'

  if (comparisonAllowed) {
    if (requestedMode === 'full') {
      resolvedMode = 'full'
      reason = 'manual_full'
    } else if (requestedMode === 'patch') {
      resolvedMode = 'patch'
      reason = 'manual_patch'
    } else if (commonPaths.length === 0) {
      resolvedMode = 'patch'
      reason = 'no_common_paths'
    } else if (overlapOfSmallerSnapshot < 0.25) {
      resolvedMode = 'patch'
      reason = 'low_overlap'
    } else if (toPaths.length < fromPaths.length * 0.7 && commonPaths.length / Math.max(toPaths.length, 1) < 0.55) {
      resolvedMode = 'patch'
      reason = 'partial_snapshot'
    } else {
      resolvedMode = 'full'
      reason = 'sufficient_overlap'
    }
  }

  let historyConfidence: HistoryConfidence = 'low'
  let historyConfidencePercent = comparisonAllowed ? 28 : 0
  if (relationshipReason === 'manual_override') {
    historyConfidencePercent = 18
  } else if (resolvedMode === 'full' && overlapOfSmallerSnapshot >= 0.75) {
    historyConfidence = 'high'
    historyConfidencePercent = 78
  } else if (resolvedMode === 'full' && overlapOfSmallerSnapshot >= 0.4) {
    historyConfidence = 'medium'
    historyConfidencePercent = 62
  } else if (requestedMode === 'patch' && comparisonAllowed) {
    historyConfidence = 'medium'
    historyConfidencePercent = 52
  } else if (commonPaths.length > 0) {
    historyConfidence = 'low'
    historyConfidencePercent = 38
  }

  return {
    requestedMode,
    resolvedMode,
    fromFileCount: fromPaths.length,
    toFileCount: toPaths.length,
    commonPathCount: commonPaths.length,
    unchangedCommonPathCount,
    modifiedCommonPathCount,
    fromOnlyPathCount,
    toOnlyPathCount,
    overlapOfSmallerSnapshot,
    removalsReliable: comparisonAllowed && resolvedMode === 'full',
    ignoredPotentialRemovals: comparisonAllowed && resolvedMode === 'patch' ? fromOnlyPathCount : 0,
    historyConfidence,
    historyConfidencePercent,
    reason,
    relationship,
    comparisonAllowed,
    relationshipConfidencePercent,
    sharedIdentityTokens,
    sharedContentHashCount,
    relationshipReason,
  }
}

function categoryRanking(changes: FileChange[]): Array<[ChangeCategory, number]> {
  const counts = new Map<ChangeCategory, number>()
  for (const change of changes) counts.set(change.category, (counts.get(change.category) ?? 0) + 1)
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
}

function searchText(snapshot: Snapshot, paths: string[]): string {
  return paths
    .map((path) => snapshot.files[path]?.content ?? '')
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

function detectFeatureTags(changes: FileChange[], to: Snapshot): FeatureTag[] {
  const paths = changes.filter((change) => change.status !== 'removed').map((change) => change.path)
  const joinedPaths = paths.join('\n').toLowerCase()
  const content = searchText(to, paths)
  const has = (pattern: RegExp) => pattern.test(joinedPaths) || pattern.test(content)
  const tags: FeatureTag[] = []

  if (has(/lk\.alex-educator|personal[_-]?account|личн(?:ый|ого) кабинет/)) tags.push('student_cabinet')
  if (has(/auth\/verify|issue_code|verify_code|lk_auth_codes|шестизначн|одноразов/)) tags.push('email_code_auth')
  if (has(/password_hash|password_verify|войти по паролю|create password|создать пароль/)) tags.push('password_auth')
  if (has(/auth\/(forgot|reset)|purpose[^\n]{0,20}reset|смены пароля/)) tags.push('password_reset')
  if (has(/csrf|session_set_cookie_params|httponly|samesite|require_user/)) tags.push('session_security')
  if (has(/contract\/index|contract_clients|contract_status|открыть договор/)) tags.push('contract_access')
  if (has(/schedule\/index|data-calendar|calendar-controls|расписание/)) tags.push('schedule_calendar')
  if (has(/payments\/index|оплаты|чеки/)) tags.push('payments_section')
  if (has(/homework\/index|домашн(?:ее|яя) задани/)) tags.push('homework_section')
  if (has(/settings\/index|профиль|изменить пароль|создать пароль/)) tags.push('settings_profile')
  if (has(/\.sql(?:\n|$)|create table|foreign key|lk_users|lk_auth_codes/)) tags.push('database_schema')
  if (has(/includes\/layout|page_header|page_footer/)) tags.push('shared_layout')
  if (has(/data-menu|sidebar[^\n]{0,40}open|@media/)) tags.push('mobile_navigation')
  if (has(/smtp_send|stream_socket_client|отправить код|отправк[аи] кода/)) tags.push('smtp_delivery')
  if (has(/install|readme-setup|php 8\.|phpmyadmin|инструкц/)) tags.push('installation_docs')

  return [...new Set(tags)]
}

function genericTitle(featureTags: FeatureTag[], scope: ScopeAnalysis): string {
  if (featureTags.includes('student_cabinet')) return 'Добавлен MVP личного кабинета'
  if (scope.resolvedMode === 'patch') return 'Добавлен отдельный модуль проекта'
  return 'Обновлена версия проекта'
}

function inferTransitionCommit(id: string, changes: FileChange[], from: Snapshot, to: Snapshot, scope: ScopeAnalysis): InferredCommit[] {
  if (!changes.length) return []
  const ranking = categoryRanking(changes)
  const category = ranking[0]?.[0] ?? 'other'
  const categories = ranking.map(([item]) => item)
  const classificationConfidence = Math.round(55 + ((ranking[0]?.[1] ?? 0) / Math.max(changes.length, 1)) * 40)
  const featureTags = detectFeatureTags(changes, to)
  const stats = summarizeStats(changes)
  const semantic = analyzeSemanticChanges(changes, from, to)

  return [{
    id: `${id}-${stableId(changes.map((change) => `${change.status}:${change.path}`).join('|'))}`,
    category,
    categories,
    featureTags,
    title: genericTitle(featureTags, scope),
    description: `${stats.filesAdded} added, ${stats.filesModified} modified, ${stats.filesRemoved} removed. ${CATEGORY_LABELS[category]}.`,
    confidence: scope.historyConfidencePercent,
    classificationConfidence,
    changes: [...changes].sort((left, right) => left.path.localeCompare(right.path)),
    semantic,
  }]
}

export function compareSnapshots(from: Snapshot, to: Snapshot, requestedMode: ComparisonMode = 'auto'): VersionTransition {
  const scope = resolveScope(from, to, requestedMode)
  const id = `${from.id}-${to.id}`
  if (!scope.comparisonAllowed) {
    return {
      id,
      from,
      to,
      scope,
      stats: summarizeStats([]),
      changes: [],
      commits: [],
    }
  }

  const paths = new Set([...comparablePaths(from), ...comparablePaths(to)])
  const changes: FileChange[] = []

  for (const path of [...paths].sort()) {
    const before = from.files[path]
    const after = to.files[path]

    if (!before && after) changes.push(makeChange(path, 'added', undefined, after))
    else if (before && !after && scope.removalsReliable) changes.push(makeChange(path, 'removed', before, undefined))
    else if (before && after && before.hash !== after.hash) changes.push(makeChange(path, 'modified', before, after))
  }

  return {
    id,
    from,
    to,
    scope,
    stats: summarizeStats(changes),
    changes,
    commits: inferTransitionCommit(id, changes, from, to, scope),
  }
}

export function analyzeSnapshots(
  inputSnapshots: Snapshot[],
  options: { comparisonMode?: ComparisonMode } = {},
): AnalysisReport {
  const requestedMode = options.comparisonMode ?? 'auto'
  const snapshots = [...inputSnapshots].sort((left, right) => {
    const byDate = new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime()
    return byDate || left.label.localeCompare(right.label)
  })

  const transitions = snapshots.slice(1).map((snapshot, index) => compareSnapshots(snapshots[index], snapshot, requestedMode))
  const totals = transitions.reduce<AnalysisReport['totals']>((result, transition) => ({
    filesAdded: result.filesAdded + transition.stats.filesAdded,
    filesModified: result.filesModified + transition.stats.filesModified,
    filesRemoved: result.filesRemoved + transition.stats.filesRemoved,
    linesAdded: result.linesAdded + transition.stats.linesAdded,
    linesRemoved: result.linesRemoved + transition.stats.linesRemoved,
    inferredCommits: result.inferredCommits + transition.commits.length,
    analyzedFiles: result.analyzedFiles,
    ignoredPotentialRemovals: result.ignoredPotentialRemovals + transition.scope.ignoredPotentialRemovals,
    semanticFacts: result.semanticFacts + transition.commits.reduce((sum, commit) => sum + commit.semantic.facts.length, 0),
    semanticCoveragePercent: 0,
  }), {
    filesAdded: 0,
    filesModified: 0,
    filesRemoved: 0,
    linesAdded: 0,
    linesRemoved: 0,
    inferredCommits: 0,
    analyzedFiles: snapshots.reduce((sum, snapshot) => sum + Object.keys(snapshot.files).length, 0),
    ignoredPotentialRemovals: 0,
    semanticFacts: 0,
    semanticCoveragePercent: 0,
  })

  const semanticCommits = transitions.flatMap((transition) => transition.commits)
  const semanticCandidates = semanticCommits.reduce((sum, commit) => sum + commit.semantic.candidateTextFiles, 0)
  const semanticRepresented = semanticCommits.reduce((sum, commit) => sum + commit.semantic.representedTextFiles, 0)
  totals.semanticCoveragePercent = semanticCandidates === 0 ? 100 : Math.round((semanticRepresented / semanticCandidates) * 100)

  return { generatedAt: new Date().toISOString(), requestedMode, snapshots, transitions, totals }
}

export function buildChangelog(report: AnalysisReport): string {
  const lines: string[] = [
    '# Reconstructed change sets',
    '',
    '> Generated by Git Time Machine. Each archive transition is one reconstructed change set, not a proven original Git commit.',
    '',
  ]

  for (const transition of [...report.transitions].reverse()) {
    lines.push(`## ${transition.to.label} — ${formatDate(transition.to.capturedAt)}`, '')
    lines.push(`- Comparison mode: ${transition.scope.resolvedMode}`)
    lines.push(`- Matching paths: ${transition.scope.commonPathCount}`)
    if (!transition.scope.comparisonAllowed) {
      lines.push('- Transition skipped: the archives could not be confirmed as versions of the same project.', '')
      continue
    }
    if (!transition.scope.removalsReliable) lines.push(`- ${transition.scope.ignoredPotentialRemovals} absent previous paths were not treated as deletions.`)
    if (!transition.changes.length) {
      lines.push('- No supported file changes detected.', '')
      continue
    }
    const commit = transition.commits[0]
    lines.push(`- ${commit.title}`)
    lines.push(`- History confidence: ${transition.scope.historyConfidence} (${transition.scope.historyConfidencePercent}%)`)
    lines.push(`- Category confidence: ${commit.classificationConfidence}%`)
    lines.push(`- Semantic coverage: ${commit.semantic.coveragePercent}% (${commit.semantic.facts.length} facts)`)
    for (const fact of commit.semantic.facts.filter((item) => item.level === 'functional').slice(0, 16)) {
      lines.push(`  - ${fact.operation.toUpperCase()} ${fact.code}: ${fact.subject} (${fact.confidence}%)`)
    }
    for (const change of commit.changes.slice(0, 24)) {
      const marker = change.status === 'added' ? 'A' : change.status === 'removed' ? 'D' : 'M'
      lines.push(`  - \`${marker}\` \`${change.path}\``)
    }
    if (commit.changes.length > 24) lines.push(`  - …and ${commit.changes.length - 24} more files`)
    lines.push('')
  }

  return lines.join('\n')
}

export function buildMarkdownReport(report: AnalysisReport): string {
  const lines: string[] = [
    '# Git Time Machine analysis',
    '',
    `Generated: ${formatDateTime(report.generatedAt)}`,
    `Requested comparison mode: ${report.requestedMode}`,
    '',
    '## Summary',
    '',
    `- Snapshots: ${report.snapshots.length}`,
    `- Reconstructed change sets: ${report.totals.inferredCommits}`,
    `- Files added: ${report.totals.filesAdded}`,
    `- Files modified: ${report.totals.filesModified}`,
    `- Confirmed files removed: ${report.totals.filesRemoved}`,
    `- Potential removals intentionally ignored: ${report.totals.ignoredPotentialRemovals}`,
    `- Semantic facts: ${report.totals.semanticFacts}`,
    `- Semantic text-file coverage: ${report.totals.semanticCoveragePercent}%`,
    '',
    '## Snapshot inventory',
    '',
  ]

  for (const snapshot of report.snapshots) {
    const profile = snapshot.profile ? `, kind: ${snapshot.profile.kind}, source files: ${snapshot.profile.sourceFiles}, generated/third-party: ${snapshot.profile.generatedFiles + snapshot.profile.thirdPartyFiles}` : ''
    lines.push(`- **${snapshot.label}** — ${Object.keys(snapshot.files).length} files, ${formatBytes(snapshot.totalBytes)}, source: \`${snapshot.sourceName}\`${profile}`)
  }

  lines.push('', buildChangelog(report))
  return lines.join('\n')
}

export function formatBytes(value: number): string {
  if (value === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}
