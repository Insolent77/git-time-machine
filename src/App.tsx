import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  analyzeSnapshots,
  buildChangelog,
  buildMarkdownReport,
  formatBytes,
  formatDate,
} from './lib/analyzer'
import { copyText, downloadText } from './lib/download'
import { makeDemoSnapshots } from './lib/demo'
import type {
  AnalysisReport,
  ChangeCategory,
  ChangeStatus,
  FileChange,
  VersionTransition,
} from './lib/types'
import { parseZipArchive, type ArchiveProgress } from './lib/zip'

type ArchiveItem = {
  id: string
  file: File
  label: string
  date: string
}

type Tab = 'timeline' | 'files' | 'report'

type StatusFilter = 'all' | ChangeStatus

const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  auth: 'Авторизация',
  database: 'База данных',
  admin: 'Админка',
  api: 'API',
  ui: 'Интерфейс',
  styles: 'Стили',
  tests: 'Тесты',
  docs: 'Документация',
  config: 'Конфигурация',
  deps: 'Зависимости',
  assets: 'Ресурсы',
  other: 'Логика',
}

const STATUS_LABELS: Record<ChangeStatus, string> = {
  added: 'Добавлен',
  modified: 'Изменён',
  removed: 'Удалён',
}

function inputDate(timestamp: number): string {
  const date = new Date(timestamp || Date.now())
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function archiveId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`
}

function dateToIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString()
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items
  const result = [...items]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

function fileDelta(change: FileChange): string {
  if (change.binary) return `${formatBytes(change.sizeBefore)} → ${formatBytes(change.sizeAfter)}`
  const parts = []
  if (change.addedLines) parts.push(`+${change.addedLines}`)
  if (change.removedLines) parts.push(`−${change.removedLines}`)
  return parts.join(' / ') || 'без изменения строк'
}

function MetricCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <article className="metric-card">
      <span className={`metric-dot ${accent ?? ''}`} />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function ChangeBadge({ status }: { status: ChangeStatus }) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status]}</span>
}

function CategoryBadge({ category }: { category: ChangeCategory }) {
  return <span className={`category-badge category-${category}`}>{CATEGORY_LABELS[category]}</span>
}

function FileChangeRow({ change }: { change: FileChange }) {
  return (
    <div className="file-change-row">
      <div className="file-main">
        <ChangeBadge status={change.status} />
        <code title={change.path}>{change.path}</code>
      </div>
      <div className="file-meta">
        <CategoryBadge category={change.category} />
        <span>{fileDelta(change)}</span>
      </div>
    </div>
  )
}

function TimelineTransition({ transition }: { transition: VersionTransition }) {
  return (
    <section className="timeline-transition">
      <div className="timeline-rail" aria-hidden="true">
        <span className="timeline-node" />
      </div>
      <div className="transition-content">
        <header className="transition-header">
          <div>
            <span className="eyebrow">Версия {formatDate(transition.to.capturedAt)}</span>
            <h3>{transition.to.label}</h3>
            <p>Из «{transition.from.label}» восстановлено {transition.commits.length} предполагаемых коммитов.</p>
          </div>
          <div className="transition-stats">
            <span className="positive">+{transition.stats.filesAdded}</span>
            <span className="neutral">~{transition.stats.filesModified}</span>
            <span className="negative">−{transition.stats.filesRemoved}</span>
          </div>
        </header>

        {transition.commits.length === 0 ? (
          <div className="empty-inline">Изменения между архивами не обнаружены.</div>
        ) : (
          <div className="commit-list">
            {transition.commits.map((commit, index) => (
              <details className="commit-card" key={commit.id} open={index === 0}>
                <summary>
                  <div className="commit-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="commit-summary">
                    <div className="commit-title-line">
                      <h4>{commit.title}</h4>
                      <CategoryBadge category={commit.category} />
                    </div>
                    <p>{commit.description}</p>
                  </div>
                  <div className="confidence" title="Оценка основана на совпадении путей файлов с известными категориями">
                    <strong>{commit.confidence}%</strong>
                    <span>уверенность</span>
                  </div>
                </summary>
                <div className="commit-files">
                  {commit.changes.map((change) => <FileChangeRow key={`${commit.id}-${change.path}`} change={change} />)}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function App() {
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [tab, setTab] = useState<Tab>('timeline')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<ArchiveProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [copied, setCopied] = useState(false)

  const changelog = useMemo(() => report ? buildChangelog(report) : '', [report])
  const markdownReport = useMemo(() => report ? buildMarkdownReport(report) : '', [report])

  const filteredTransitions = useMemo(() => {
    if (!report) return []
    const normalizedQuery = query.trim().toLowerCase()

    return report.transitions
      .map((transition) => ({
        ...transition,
        changes: transition.changes.filter((change) => {
          const statusMatches = statusFilter === 'all' || change.status === statusFilter
          const queryMatches = !normalizedQuery || change.path.toLowerCase().includes(normalizedQuery)
          return statusMatches && queryMatches
        }),
      }))
      .filter((transition) => transition.changes.length > 0)
  }, [report, query, statusFilter])

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const zipFiles = incoming.filter((file) => file.name.toLowerCase().endsWith('.zip'))

    if (!zipFiles.length) {
      setError('Выберите обычные ZIP-архивы. RAR и 7z появятся в следующих версиях.')
      return
    }

    setError(incoming.length === zipFiles.length ? null : 'Некоторые файлы пропущены: сейчас поддерживается только ZIP.')
    setReport(null)
    setArchives((current) => [
      ...current,
      ...zipFiles.map((file) => ({
        id: archiveId(file),
        file,
        label: file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' ').trim(),
        date: inputDate(file.lastModified),
      })),
    ])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  async function runAnalysis() {
    if (archives.length < 2) {
      setError('Добавьте минимум две версии проекта, чтобы построить историю изменений.')
      return
    }

    setBusy(true)
    setError(null)
    setReport(null)

    try {
      const snapshots = []
      for (const archive of archives) {
        snapshots.push(await parseZipArchive(archive.file, {
          label: archive.label,
          capturedAt: dateToIso(archive.date),
          onProgress: setProgress,
        }))
      }
      setReport(analyzeSnapshots(snapshots))
      setTab('timeline')
      requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось проанализировать архивы.')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  function runDemo() {
    setError(null)
    setArchives([])
    setReport(analyzeSnapshots(makeDemoSnapshots()))
    setTab('timeline')
    requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }))
  }

  async function copyChangelog() {
    try {
      await copyText(changelog)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Браузер не разрешил копирование. Скачайте CHANGELOG.md кнопкой рядом.')
    }
  }

  function reset() {
    setArchives([])
    setReport(null)
    setError(null)
    setProgress(null)
    setQuery('')
    setStatusFilter('all')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Git Time Machine — наверх">
          <span className="brand-mark">GTM</span>
          <span>
            <strong>Git Time Machine</strong>
            <small>reconstruct development history</small>
          </span>
        </a>
        <div className="topbar-actions">
          <span className="privacy-pill"><span />100% в браузере</span>
          <a className="ghost-button" href="https://github.com/" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">01 — Code archaeology</span>
            <h1>История кода.<br /><em>Восстановлена.</em></h1>
            <p>
              Загрузите старые ZIP-версии. Git Time Machine сравнит файлы, восстановит вероятные этапы разработки
              и подготовит понятный CHANGELOG — без отправки исходников на сервер.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#workspace">Загрузить версии</a>
              <button className="secondary-button" type="button" onClick={runDemo}>Открыть демо</button>
            </div>
            <div className="hero-proof">
              <span><strong>ZIP</strong> обработка</span>
              <span><strong>SHA-256</strong> сравнение</span>
              <span><strong>Markdown</strong> экспорт</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Пример восстановленной истории">
            <div className="visual-window">
              <div className="window-bar"><span /><span /><span /><small>timeline.reconstructed</small></div>
              <div className="visual-code">
                <div className="code-line dim"><b>01</b><span>prototype.zip</span><i>3 files</i></div>
                <div className="visual-connector" />
                <div className="code-line"><b>02</b><span>student-cabinet.zip</span><i className="plus">+5</i></div>
                <div className="visual-commit"><span>feat</span> Добавлен личный кабинет</div>
                <div className="visual-commit"><span>style</span> Адаптирован интерфейс</div>
                <div className="visual-connector" />
                <div className="code-line"><b>03</b><span>contracts-admin.zip</span><i className="plus">+8</i></div>
                <div className="visual-commit active"><span>feat</span> Электронные договоры</div>
                <div className="visual-commit"><span>test</span> Проверка создания договора</div>
              </div>
            </div>
            <div className="floating-card floating-one"><strong>12</strong><span>commits inferred</span></div>
            <div className="floating-card floating-two"><strong>92%</strong><span>top confidence</span></div>
          </div>
        </section>

        <section className="workspace" id="workspace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Шаг 1</span>
              <h2>Добавьте версии проекта</h2>
              <p>Лучше использовать архивы из разных дат. Папки зависимостей и сборки будут исключены автоматически.</p>
            </div>
            {archives.length > 0 && <button className="text-button danger-text" type="button" onClick={reset}>Очистить всё</button>}
          </div>

          <div
            className={`dropzone ${dragging ? 'is-dragging' : ''}`}
            onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true) }}
            onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="drop-icon">⇩</div>
            <h3>Перетащите ZIP-архивы сюда</h3>
            <p>или выберите несколько файлов на компьютере</p>
            <label className="file-button">
              Выбрать архивы
              <input type="file" accept=".zip,application/zip" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files && addFiles(event.target.files)} />
            </label>
            <small>До 200 МБ на архив · файлы не загружаются в интернет</small>
          </div>

          {error && <div className="error-banner"><strong>Проверьте данные:</strong> {error}</div>}

          {archives.length > 0 && (
            <div className="archive-panel">
              <div className="archive-panel-head">
                <div>
                  <strong>Выбрано версий: {archives.length}</strong>
                  <span>Дата определяет порядок истории. Название станет заголовком версии.</span>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setArchives((items) => [...items].sort((left, right) => left.date.localeCompare(right.date)))}
                >
                  Сортировать по дате
                </button>
              </div>

              <div className="archive-list">
                {archives.map((archive, index) => (
                  <div className="archive-row" key={archive.id}>
                    <div className="archive-order">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <button type="button" disabled={index === 0} onClick={() => setArchives((items) => moveItem(items, index, index - 1))}>↑</button>
                        <button type="button" disabled={index === archives.length - 1} onClick={() => setArchives((items) => moveItem(items, index, index + 1))}>↓</button>
                      </div>
                    </div>
                    <div className="archive-file">
                      <span className="zip-icon">ZIP</span>
                      <div>
                        <strong>{archive.file.name}</strong>
                        <small>{formatBytes(archive.file.size)}</small>
                      </div>
                    </div>
                    <label>
                      <span>Название версии</span>
                      <input
                        value={archive.label}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, label: event.target.value } : item))}
                      />
                    </label>
                    <label>
                      <span>Дата версии</span>
                      <input
                        type="date"
                        value={archive.date}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, date: event.target.value } : item))}
                      />
                    </label>
                    <button className="remove-button" type="button" aria-label={`Удалить ${archive.file.name}`} onClick={() => setArchives((items) => items.filter((item) => item.id !== archive.id))}>×</button>
                  </div>
                ))}
              </div>

              <div className="analysis-action">
                <div>
                  <strong>{archives.length >= 2 ? 'Всё готово к сравнению' : 'Нужна ещё одна версия'}</strong>
                  <span>{archives.length >= 2 ? 'Анализ выполняется локально и может занять время на больших архивах.' : 'Минимум два архива позволяют определить, что изменилось.'}</span>
                </div>
                <button className="primary-button" type="button" disabled={busy || archives.length < 2} onClick={runAnalysis}>
                  {busy ? 'Анализируем…' : 'Восстановить историю'}
                </button>
              </div>

              {busy && progress && (
                <div className="progress-block">
                  <div className="progress-copy">
                    <strong>{progress.archive}</strong>
                    <span>{progress.currentPath ?? 'Завершаем обработку'}</span>
                  </div>
                  <div className="progress-track"><span style={{ width: `${progress.total ? Math.round(progress.processed / progress.total * 100) : 0}%` }} /></div>
                  <small>{progress.processed} / {progress.total}</small>
                </div>
              )}
            </div>
          )}
        </section>

        {report && (
          <section className="results" id="results">
            <div className="section-heading results-heading">
              <div>
                <span className="eyebrow">Результат анализа</span>
                <h2>Предполагаемая история разработки</h2>
                <p>Это реконструкция, а не доказанная Git-история. Проверьте формулировки перед публикацией.</p>
              </div>
              <div className="export-actions">
                <button type="button" className="secondary-button" onClick={() => downloadText('git-time-machine-report.json', JSON.stringify(report, null, 2), 'application/json')}>JSON</button>
                <button type="button" className="secondary-button" onClick={() => downloadText('ANALYSIS.md', markdownReport, 'text/markdown;charset=utf-8')}>Отчёт</button>
                <button type="button" className="primary-button" onClick={() => downloadText('CHANGELOG.md', changelog, 'text/markdown;charset=utf-8')}>Скачать CHANGELOG</button>
              </div>
            </div>

            <div className="metrics-grid">
              <MetricCard value={report.snapshots.length} label="версий проекта" accent="purple" />
              <MetricCard value={report.totals.inferredCommits} label="предполагаемых коммитов" accent="cyan" />
              <MetricCard value={`+${report.totals.linesAdded}`} label="добавлено строк" accent="green" />
              <MetricCard value={`−${report.totals.linesRemoved}`} label="удалено строк" accent="red" />
              <MetricCard value={report.totals.analyzedFiles} label="файлов обработано" accent="amber" />
            </div>

            <div className="result-tabs" role="tablist">
              <button className={tab === 'timeline' ? 'active' : ''} type="button" onClick={() => setTab('timeline')}>Хронология</button>
              <button className={tab === 'files' ? 'active' : ''} type="button" onClick={() => setTab('files')}>Все изменения</button>
              <button className={tab === 'report' ? 'active' : ''} type="button" onClick={() => setTab('report')}>CHANGELOG</button>
            </div>

            {tab === 'timeline' && (
              <div className="timeline">
                <div className="timeline-origin">
                  <span className="timeline-node origin" />
                  <div>
                    <span className="eyebrow">Исходная версия · {formatDate(report.snapshots[0].capturedAt)}</span>
                    <h3>{report.snapshots[0].label}</h3>
                    <p>{Object.keys(report.snapshots[0].files).length} файлов · {formatBytes(report.snapshots[0].totalBytes)}</p>
                  </div>
                </div>
                {report.transitions.map((transition) => <TimelineTransition key={transition.id} transition={transition} />)}
              </div>
            )}

            {tab === 'files' && (
              <div className="files-view">
                <div className="files-toolbar">
                  <input placeholder="Поиск по пути файла…" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} />
                  <div className="filter-buttons">
                    {(['all', 'added', 'modified', 'removed'] as StatusFilter[]).map((status) => (
                      <button key={status} className={statusFilter === status ? 'active' : ''} type="button" onClick={() => setStatusFilter(status)}>
                        {status === 'all' ? 'Все' : STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredTransitions.length ? filteredTransitions.map((transition) => (
                  <section className="file-group" key={transition.id}>
                    <header><strong>{transition.from.label} → {transition.to.label}</strong><span>{transition.changes.length} изменений</span></header>
                    <div>{transition.changes.map((change) => <FileChangeRow key={`${transition.id}-${change.path}`} change={change} />)}</div>
                  </section>
                )) : <div className="empty-state">По выбранному фильтру ничего не найдено.</div>}
              </div>
            )}

            {tab === 'report' && (
              <div className="report-view">
                <div className="report-toolbar">
                  <div>
                    <strong>CHANGELOG.md</strong>
                    <span>Готовый черновик для репозитория</span>
                  </div>
                  <button className="secondary-button" type="button" onClick={copyChangelog}>{copied ? 'Скопировано ✓' : 'Копировать'}</button>
                </div>
                <pre>{changelog}</pre>
              </div>
            )}
          </section>
        )}

        <section className="how-it-works">
          <div className="section-heading centered">
            <div>
              <span className="eyebrow">Метод</span>
              <h2>Четыре шага. Никакой магии.</h2>
            </div>
          </div>
          <div className="steps-grid">
            <article><span>01</span><h3>Читаем архивы</h3><p>JSZip распаковывает версии локально. Служебные каталоги и тяжёлые сборочные файлы исключаются.</p></article>
            <article><span>02</span><h3>Сравниваем снимки</h3><p>SHA-256 определяет изменённые файлы, а анализ текста оценивает добавленные и удалённые строки.</p></article>
            <article><span>03</span><h3>Восстанавливаем этапы</h3><p>Изменения группируются по авторизации, БД, API, интерфейсу, тестам и другим областям проекта.</p></article>
            <article><span>04</span><h3>Экспортируем результат</h3><p>Скачайте CHANGELOG, полный Markdown-отчёт или JSON для дальнейшей автоматизации.</p></article>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand compact"><span className="brand-mark">GTM</span><span><strong>Git Time Machine</strong><small>open-source portfolio project</small></span></div>
        <p>Исходные файлы обрабатываются только в вашем браузере.</p>
        <span>MIT License · MVP 0.1.0</span>
      </footer>
    </div>
  )
}

export default App
