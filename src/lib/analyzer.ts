import type {
  AnalysisReport,
  ChangeCategory,
  ChangeStats,
  FileChange,
  InferredCommit,
  Snapshot,
  SnapshotFile,
  VersionTransition,
} from './types'

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

const CATEGORY_TITLES: Record<ChangeCategory, string> = {
  auth: 'Развита система авторизации и доступа',
  database: 'Обновлена структура и работа с данными',
  admin: 'Расширена административная панель',
  api: 'Обновлена API- и серверная логика',
  ui: 'Улучшен пользовательский интерфейс',
  styles: 'Доработано оформление и адаптивность',
  tests: 'Добавлены проверки и тестовые сценарии',
  docs: 'Актуализирована документация проекта',
  config: 'Обновлена конфигурация и инфраструктура',
  deps: 'Обновлены зависимости проекта',
  assets: 'Обновлены изображения и статические ресурсы',
  other: 'Доработана логика проекта',
}

const CATEGORY_PATTERNS: Array<[ChangeCategory, RegExp[]]> = [
  ['auth', [/auth/i, /login/i, /logout/i, /password/i, /session/i, /token/i, /permission/i, /role/i, /доступ/i]],
  ['database', [/migration/i, /schema/i, /database/i, /\bdb\b/i, /models?\./i, /entities/i, /repository/i, /sql$/i]],
  ['admin', [/admin/i, /dashboard/i, /backoffice/i, /moderation/i]],
  ['api', [/\/api\//i, /controller/i, /service/i, /route/i, /endpoint/i, /server/i, /backend/i, /\.php$/i]],
  ['tests', [/test/i, /spec/i, /__tests__/i, /playwright/i, /cypress/i, /vitest/i, /jest/i]],
  ['docs', [/readme/i, /changelog/i, /docs?\//i, /\.md$/i, /license/i]],
  ['deps', [/package-lock\.json$/i, /package\.json$/i, /pnpm-lock/i, /yarn\.lock/i, /composer\.lock/i, /requirements\.txt$/i, /poetry\.lock/i]],
  ['config', [/\.github\//i, /docker/i, /nginx/i, /\.env/i, /config/i, /vite\.config/i, /tsconfig/i, /eslint/i, /prettier/i, /\.ya?ml$/i]],
  ['styles', [/\.css$/i, /\.scss$/i, /\.sass$/i, /\.less$/i, /tailwind/i, /styles?\//i]],
  ['ui', [/components?\//i, /pages?\//i, /views?\//i, /templates?\//i, /\.tsx$/i, /\.jsx$/i, /\.vue$/i, /\.svelte$/i, /\.html$/i]],
  ['assets', [/assets?\//i, /public\//i, /uploads?\//i, /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|webm|pdf)$/i]],
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
    return {
      added: newLines.length - common,
      removed: oldLines.length - common,
    }
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

  return {
    added: newLines.length - common,
    removed: oldLines.length - common,
  }
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
  }, {
    filesAdded: 0,
    filesModified: 0,
    filesRemoved: 0,
    linesAdded: 0,
    linesRemoved: 0,
  })
}

function describeCommit(category: ChangeCategory, changes: FileChange[]): string {
  const stats = summarizeStats(changes)
  const actions: string[] = []
  if (stats.filesAdded) actions.push(`добавлено файлов: ${stats.filesAdded}`)
  if (stats.filesModified) actions.push(`изменено: ${stats.filesModified}`)
  if (stats.filesRemoved) actions.push(`удалено: ${stats.filesRemoved}`)

  const importantPaths = [...changes]
    .sort((left, right) => (right.addedLines + right.removedLines + right.sizeAfter) - (left.addedLines + left.removedLines + left.sizeAfter))
    .slice(0, 3)
    .map((change) => change.path)

  return `${CATEGORY_LABELS[category]}: ${actions.join(', ') || 'обновлены связанные файлы'}. Ключевые файлы: ${importantPaths.join(', ')}.`
}

function calculateConfidence(category: ChangeCategory, changes: FileChange[]): number {
  const pathSignal = changes.filter((change) => categorizePath(change.path) === category).length / Math.max(changes.length, 1)
  const fileSignal = Math.min(changes.length / 6, 1)
  const confidence = 0.58 + pathSignal * 0.27 + fileSignal * 0.1
  return Math.round(Math.min(confidence, 0.95) * 100)
}

function inferCommits(transitionId: string, changes: FileChange[]): InferredCommit[] {
  const grouped = new Map<ChangeCategory, FileChange[]>()
  for (const change of changes) {
    const current = grouped.get(change.category) ?? []
    current.push(change)
    grouped.set(change.category, current)
  }

  return [...grouped.entries()]
    .sort(([, left], [, right]) => right.length - left.length)
    .map(([category, categoryChanges], index) => ({
      id: `${transitionId}-${index}-${stableId(categoryChanges.map((change) => change.path).join('|'))}`,
      category,
      title: CATEGORY_TITLES[category],
      description: describeCommit(category, categoryChanges),
      confidence: calculateConfidence(category, categoryChanges),
      changes: categoryChanges.sort((left, right) => left.path.localeCompare(right.path)),
    }))
}

export function compareSnapshots(from: Snapshot, to: Snapshot): VersionTransition {
  const paths = new Set([...Object.keys(from.files), ...Object.keys(to.files)])
  const changes: FileChange[] = []

  for (const path of [...paths].sort()) {
    const before = from.files[path]
    const after = to.files[path]

    if (!before && after) changes.push(makeChange(path, 'added', undefined, after))
    else if (before && !after) changes.push(makeChange(path, 'removed', before, undefined))
    else if (before && after && before.hash !== after.hash) changes.push(makeChange(path, 'modified', before, after))
  }

  const id = `${from.id}-${to.id}`
  return {
    id,
    from,
    to,
    stats: summarizeStats(changes),
    changes,
    commits: inferCommits(id, changes),
  }
}

export function analyzeSnapshots(inputSnapshots: Snapshot[]): AnalysisReport {
  const snapshots = [...inputSnapshots].sort((left, right) => {
    const byDate = new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime()
    return byDate || left.label.localeCompare(right.label)
  })

  const transitions = snapshots.slice(1).map((snapshot, index) => compareSnapshots(snapshots[index], snapshot))
  const transitionStats = transitions.map((transition) => transition.stats)

  const totals = transitionStats.reduce<AnalysisReport['totals']>((result, stats) => ({
    filesAdded: result.filesAdded + stats.filesAdded,
    filesModified: result.filesModified + stats.filesModified,
    filesRemoved: result.filesRemoved + stats.filesRemoved,
    linesAdded: result.linesAdded + stats.linesAdded,
    linesRemoved: result.linesRemoved + stats.linesRemoved,
    inferredCommits: result.inferredCommits,
    analyzedFiles: result.analyzedFiles,
  }), {
    filesAdded: 0,
    filesModified: 0,
    filesRemoved: 0,
    linesAdded: 0,
    linesRemoved: 0,
    inferredCommits: transitions.reduce((sum, transition) => sum + transition.commits.length, 0),
    analyzedFiles: snapshots.reduce((sum, snapshot) => sum + Object.keys(snapshot.files).length, 0),
  })

  return {
    generatedAt: new Date().toISOString(),
    snapshots,
    transitions,
    totals,
  }
}

export function buildChangelog(report: AnalysisReport): string {
  const lines: string[] = [
    '# Reconstructed changelog',
    '',
    '> Generated by Git Time Machine. Commit grouping and titles are inferred from file changes and should be reviewed before use.',
    '',
  ]

  for (const transition of [...report.transitions].reverse()) {
    lines.push(`## ${transition.to.label} — ${formatDate(transition.to.capturedAt)}`, '')

    if (!transition.changes.length) {
      lines.push('- No file changes detected.', '')
      continue
    }

    for (const commit of transition.commits) {
      lines.push(`### ${commit.title}`, '')
      lines.push(`- Confidence: ${commit.confidence}%`)
      lines.push(`- ${commit.description}`)
      for (const change of commit.changes.slice(0, 12)) {
        const marker = change.status === 'added' ? 'A' : change.status === 'removed' ? 'D' : 'M'
        lines.push(`  - \`${marker}\` \`${change.path}\``)
      }
      if (commit.changes.length > 12) lines.push(`  - …and ${commit.changes.length - 12} more files`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

export function buildMarkdownReport(report: AnalysisReport): string {
  const lines: string[] = [
    '# Git Time Machine analysis',
    '',
    `Generated: ${formatDateTime(report.generatedAt)}`,
    '',
    '## Summary',
    '',
    `- Snapshots: ${report.snapshots.length}`,
    `- Inferred commits: ${report.totals.inferredCommits}`,
    `- Files added: ${report.totals.filesAdded}`,
    `- Files modified: ${report.totals.filesModified}`,
    `- Files removed: ${report.totals.filesRemoved}`,
    `- Lines added: ${report.totals.linesAdded}`,
    `- Lines removed: ${report.totals.linesRemoved}`,
    '',
    '## Snapshot inventory',
    '',
  ]

  for (const snapshot of report.snapshots) {
    lines.push(`- **${snapshot.label}** — ${Object.keys(snapshot.files).length} files, ${formatBytes(snapshot.totalBytes)}, source: \`${snapshot.sourceName}\``)
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
