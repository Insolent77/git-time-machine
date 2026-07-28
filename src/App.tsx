import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { analyzeSnapshots, formatBytes } from './lib/analyzer'
import { ArchiveAnalysisError, normalizeArchiveError } from './lib/archive-errors'
import { copyText, downloadText } from './lib/download'
import { makeDemoSnapshots } from './lib/demo'
import type { AnalysisReport, ChangeStatus, ComparisonMode } from './lib/types'
import {
  ARCHIVE_ACCEPT,
  SUPPORTED_ARCHIVE_EXTENSIONS,
  archiveExtension,
  isSupportedArchive,
  parseProjectArchive,
  type ArchiveProgress,
} from './lib/zip'
import {
  COPY,
  LANGUAGE_OPTIONS,
  archiveErrorHint,
  buildCommitDossier,
  buildDetailedReport,
  categoryLabel,
  comparisonModeLabel,
  formatLocalizedDate,
  historyConfidenceLabel,
  lineDeltaLabel,
  scopeDiagnostic,
  snapshotDiagnostic,
  statusLabel,
  type CommitStatusMode,
  type Language,
} from './i18n'

type ArchiveItem = {
  id: string
  file: File
  label: string
  date: string
}

type View = 'commits' | 'files' | 'export'
type StatusFilter = 'all' | ChangeStatus
type IssueState = { severity: 'error' | 'warning'; error: ArchiveAnalysisError }

function inputDate(timestamp: number): string {
  const date = new Date(timestamp || Date.now())
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function archiveId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`
}

function dateToIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString()
}

function labelFromFile(fileName: string): string {
  const extension = archiveExtension(fileName)
  return fileName
    .slice(0, extension ? -extension.length : undefined)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getInitialLanguage(): Language {
  const saved = window.localStorage.getItem('gtm-language')
  return LANGUAGE_OPTIONS.some((option) => option.code === saved) ? saved as Language : 'en'
}

function LiquidEye() {
  const eyeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let frame = 0
    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 18
        const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 12
        eyeRef.current?.style.setProperty('--look-x', `${x}px`)
        eyeRef.current?.style.setProperty('--look-y', `${y}px`)
        document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`)
        document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`)
      })
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <div className="liquid-eye-wrap" aria-hidden="true">
      <div className="liquid-eye" ref={eyeRef}>
        <div className="eye-reflection" />
        <div className="eye-iris"><span /></div>
      </div>
      <span className="eye-caption">WATCHING DIFF / LOCAL ONLY</span>
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [view, setView] = useState<View>('commits')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<ArchiveProgress | null>(null)
  const [issue, setIssue] = useState<IssueState | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [domain, setDomain] = useState(() => window.localStorage.getItem('gtm-domain') ?? '')
  const [sourceNote, setSourceNote] = useState(() => window.localStorage.getItem('gtm-source-note') ?? '')
  const [commitStatus, setCommitStatus] = useState<CommitStatusMode>(() => {
    const value = window.localStorage.getItem('gtm-commit-status')
    return value === 'implemented' || value === 'verified' ? value : 'reconstructed'
  })
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(() => {
    const value = window.localStorage.getItem('gtm-comparison-mode')
    return value === 'full' || value === 'patch' ? value : 'auto'
  })
  const c = COPY[language]

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem('gtm-language', language)
  }, [language])

  useEffect(() => {
    window.localStorage.setItem('gtm-domain', domain)
    window.localStorage.setItem('gtm-source-note', sourceNote)
    window.localStorage.setItem('gtm-commit-status', commitStatus)
    window.localStorage.setItem('gtm-comparison-mode', comparisonMode)
  }, [domain, sourceNote, commitStatus, comparisonMode])

  const commitRows = useMemo(() => {
    if (!report) return []
    let serial = 1
    return report.transitions.flatMap((transition) => transition.commits.map((commit) => ({
      transition,
      commit,
      serial: serial++,
    })))
  }, [report])

  const detailedReport = useMemo(() => report ? buildDetailedReport({
    report,
    language,
    domain,
    sourceNote,
    status: commitStatus,
  }) : '', [report, language, domain, sourceNote, commitStatus])

  const filteredChanges = useMemo(() => {
    if (!report) return []
    const needle = query.trim().toLowerCase()
    return report.transitions.flatMap((transition) => transition.changes
      .filter((change) => (statusFilter === 'all' || change.status === statusFilter)
        && (!needle || change.path.toLowerCase().includes(needle)))
      .map((change) => ({ transition, change })))
  }, [report, query, statusFilter])

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const supported = incoming.filter((file) => isSupportedArchive(file.name))
    const unsupported = incoming.filter((file) => !isSupportedArchive(file.name))

    if (!supported.length) {
      setIssue({
        severity: 'error',
        error: new ArchiveAnalysisError({
          code: 'UNSUPPORTED_FORMAT',
          archiveName: unsupported[0]?.name ?? '—',
          message: c.unsupportedSelected,
          technical: `${c.skippedFiles}: ${unsupported.map((file) => file.name).join(', ')}. Supported: ${SUPPORTED_ARCHIVE_EXTENSIONS.join(', ')}`,
        }),
      })
      return
    }

    setReport(null)
    setArchives((current) => [
      ...current,
      ...supported.map((file) => ({
        id: archiveId(file),
        file,
        label: labelFromFile(file.name) || file.name,
        date: inputDate(file.lastModified),
      })),
    ])

    setIssue(unsupported.length ? {
      severity: 'warning',
      error: new ArchiveAnalysisError({
        code: 'UNSUPPORTED_FORMAT',
        archiveName: unsupported[0].name,
        message: c.unsupportedSelected,
        technical: `${c.skippedFiles}: ${unsupported.map((file) => file.name).join(', ')}`,
      }),
    } : null)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  async function runAnalysis() {
    if (archives.length < 2) {
      setIssue({
        severity: 'error',
        error: new ArchiveAnalysisError({ code: 'UNKNOWN', archiveName: '—', message: c.errorMinimum }),
      })
      return
    }

    setBusy(true)
    setIssue(null)
    setReport(null)

    try {
      const snapshots = []
      for (const archive of archives) {
        try {
          snapshots.push(await parseProjectArchive(archive.file, {
            label: archive.label,
            capturedAt: dateToIso(archive.date),
            onProgress: setProgress,
            capturePrecision: 'date',
          }))
        } catch (error) {
          throw normalizeArchiveError(error, archive.file.name)
        }
      }
      setReport(analyzeSnapshots(snapshots, { comparisonMode }))
      setView('commits')
      requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }))
    } catch (error) {
      setIssue({ severity: 'error', error: normalizeArchiveError(error, progress?.archive ?? '—') })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  function runDemo() {
    setIssue(null)
    setArchives([])
    setReport(analyzeSnapshots(makeDemoSnapshots(), { comparisonMode }))
    setView('commits')
    requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }))
  }

  async function copyCommit(id: string, text: string) {
    try {
      await copyText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setIssue({ severity: 'error', error: new ArchiveAnalysisError({ code: 'UNKNOWN', archiveName: '—', message: c.errorCopy }) })
    }
  }

  function reset() {
    setArchives([])
    setReport(null)
    setIssue(null)
    setProgress(null)
    setQuery('')
    setStatusFilter('all')
  }

  const progressText = progress?.stage === 'opening'
    ? c.progressOpening
    : progress?.stage === 'extracting'
      ? c.progressExtracting
      : c.progressHashing

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#top" className="wordmark">GTM<span>/04</span></a>
        <nav className="language-switch" aria-label="Language">
          {LANGUAGE_OPTIONS.map((option) => (
            <button key={option.code} className={language === option.code ? 'active' : ''} type="button" onClick={() => setLanguage(option.code)} title={option.name}>
              {option.short}
            </button>
          ))}
        </nav>
        <a className="github-link" href="https://github.com/Insolent77/git-time-machine" target="_blank" rel="noreferrer">{c.sourceCode} ↗</a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{c.tagline} / {c.buildLabel}</span>
            <h1>{c.heroTitle}</h1>
            <p>{c.heroText}</p>
            <div className="hero-actions">
              <a className="primary-action" href="#upload">{c.upload} <span>↘</span></a>
              <button className="text-action" type="button" onClick={runDemo}>{c.demo}</button>
            </div>
            <small>{c.localOnly}</small>
          </div>
          <LiquidEye />
          <div className="format-ticker"><span>{c.supported}</span><span>{c.supported}</span></div>
        </section>

        <section className="upload-section" id="upload">
          <header className="section-line">
            <span>01</span><h2>{c.versions}</h2><small>{archives.length || '00'}</small>
          </header>

          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true) }}
            onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <strong>{archives.length ? c.addAnother : c.dropHint}</strong>
            <span>{c.supported}</span>
            <label className="primary-action">
              {c.selectFiles} <span>＋</span>
              <input type="file" accept={ARCHIVE_ACCEPT} multiple onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files && addFiles(event.target.files)} />
            </label>
          </div>

          {issue && (
            <section className={`diagnostic ${issue.severity}`} role={issue.severity === 'error' ? 'alert' : 'status'}>
              <header><strong>{c.errorTitle}</strong><code>{issue.error.code}</code></header>
              <dl>
                <div><dt>{c.archive}</dt><dd>{issue.error.archiveName || '—'}</dd></div>
                <div><dt>{c.reason}</dt><dd>{issue.error.message}</dd></div>
                <div><dt>{c.howToFix}</dt><dd>{archiveErrorHint(language, issue.error)}</dd></div>
                {(issue.error.path || issue.error.technical) && <div><dt>{c.technical}</dt><dd>{issue.error.path ? `${issue.error.path}. ` : ''}{issue.error.technical}</dd></div>}
              </dl>
            </section>
          )}

          {archives.length > 0 && (
            <div className="archive-list">
              {archives.map((archive, index) => (
                <div className="archive-row" key={archive.id}>
                  <span className="archive-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="archive-type">{archiveExtension(archive.file.name).replace('.', '').toUpperCase()}</span>
                  <div className="archive-name"><strong>{archive.file.name}</strong><small>{formatBytes(archive.file.size)}</small></div>
                  <label><span>{c.versionLabel}</span><input value={archive.label} onChange={(event: ChangeEvent<HTMLInputElement>) => setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, label: event.target.value } : item))} /></label>
                  <label><span>{c.captureDate}</span><input type="date" value={archive.date} onChange={(event: ChangeEvent<HTMLInputElement>) => setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, date: event.target.value } : item))} /></label>
                  <div className="row-actions">
                    <button type="button" title={c.moveUp} disabled={index === 0} onClick={() => setArchives((items) => {
                      const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next
                    })}>↑</button>
                    <button type="button" title={c.moveDown} disabled={index === archives.length - 1} onClick={() => setArchives((items) => {
                      const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next
                    })}>↓</button>
                    <button type="button" title={c.remove} onClick={() => setArchives((items) => items.filter((item) => item.id !== archive.id))}>×</button>
                  </div>
                </div>
              ))}

              <details className="metadata-settings">
                <summary>{c.commitSettings} <span>＋</span></summary>
                <div>
                  <label><span>{c.projectDomain} / {c.optional}</span><input placeholder="admin.example.com" value={domain} onChange={(event: ChangeEvent<HTMLInputElement>) => setDomain(event.target.value)} /></label>
                  <label><span>{c.sourceNote} / {c.optional}</span><input placeholder="User request / task / archive source" value={sourceNote} onChange={(event: ChangeEvent<HTMLInputElement>) => setSourceNote(event.target.value)} /></label>
                  <label><span>{c.status}</span><select value={commitStatus} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCommitStatus(event.target.value as CommitStatusMode)}><option value="reconstructed">{c.statusReconstructed}</option><option value="implemented">{c.statusImplemented}</option><option value="verified">{c.statusVerified}</option></select></label>
                  <label><span>{language === 'ru' ? 'Режим сравнения' : 'Comparison mode'}</span><select value={comparisonMode} onChange={(event: ChangeEvent<HTMLSelectElement>) => setComparisonMode(event.target.value as ComparisonMode)}><option value="auto">{comparisonModeLabel(language, 'auto')}</option><option value="full">{comparisonModeLabel(language, 'full')}</option><option value="patch">{comparisonModeLabel(language, 'patch')}</option></select></label>
                </div>
              </details>

              <div className="analysis-command">
                <div><strong>{archives.length >= 2 ? `${archives.length} / READY` : c.needTwo}</strong><small>{c.localOnly}</small></div>
                <button className="primary-action" type="button" disabled={busy || archives.length < 2} onClick={runAnalysis}>{busy ? `${c.analyzing}…` : c.analyze}<span>→</span></button>
                <button className="text-action danger" type="button" onClick={reset}>{c.clear}</button>
              </div>

              {busy && progress && (
                <div className="progress">
                  <div><strong>{progressText}</strong><span>{progress.archive}</span><small>{progress.currentPath}</small></div>
                  <i><span style={{ width: `${progress.total ? Math.round(progress.processed / progress.total * 100) : 8}%` }} /></i>
                </div>
              )}
            </div>
          )}
        </section>

        {report && (
          <section className="results-section" id="results">
            <header className="section-line">
              <span>02</span><h2>{c.results}</h2><small>{report.totals.inferredCommits}</small>
            </header>

            <nav className="view-switch">
              {(['commits', 'files', 'export'] as View[]).map((item) => (
                <button type="button" key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>
                  {item === 'commits' ? c.commits : item === 'files' ? c.files : c.export}
                </button>
              ))}
            </nav>

            {report.snapshots.map((snapshot) => {
              const diagnostic = snapshotDiagnostic(language, snapshot)
              return diagnostic ? (
                <section className="scope-notice" key={`snapshot-${snapshot.id}`}>
                  <strong>{diagnostic.title}</strong>
                  <p>{diagnostic.body}</p>
                </section>
              ) : null
            })}

            {report.transitions.map((transition) => {
              const diagnostic = scopeDiagnostic(language, transition.scope)
              return diagnostic ? (
                <section className="scope-notice" key={`scope-${transition.id}`}>
                  <strong>{diagnostic.title}</strong>
                  <p>{diagnostic.body}</p>
                </section>
              ) : null
            })}

            {view === 'commits' && (
              <div className="commit-stream">
                {commitRows.length ? commitRows.map(({ transition, commit, serial }, index) => {
                  const id = `${transition.id}-${commit.id}`
                  const dossier = buildCommitDossier({ transition, commit, serial, language, domain, sourceNote, status: commitStatus })
                  return (
                    <details className="commit-entry" key={id} open={index === 0}>
                      <summary>
                        <span>LOCAL-{String(serial).padStart(4, '0')}</span>
                        <strong>{categoryLabel(language, commit.category)}</strong>
                        <small>{formatLocalizedDate(transition.to.capturedAt, language)} · {historyConfidenceLabel(language, transition.scope.historyConfidence)} / {commit.confidence}%</small>
                        <i>＋</i>
                      </summary>
                      <div className="commit-content">
                        <div className="commit-toolbar"><span>{c.detailedCommit}</span><button type="button" onClick={() => copyCommit(id, dossier)}>{copiedId === id ? c.copied : c.copy}</button></div>
                        <pre>{dossier}</pre>
                      </div>
                    </details>
                  )
                }) : <p className="empty-result">{report.transitions.some((transition) => !transition.scope.comparisonAllowed)
                  ? (language === 'ru' ? 'Коммиты не сформированы: связь между загруженными архивами не подтверждена.' : 'No commits were generated because the uploaded archives could not be confirmed as versions of the same project.')
                  : c.noChanges}</p>}
              </div>
            )}

            {view === 'files' && (
              <div className="files-view">
                <div className="file-filters">
                  <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder={c.search} />
                  <select value={statusFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">{c.all}</option><option value="added">{c.added}</option><option value="modified">{c.modified}</option><option value="removed">{c.removed}</option></select>
                </div>
                {filteredChanges.length ? filteredChanges.map(({ transition, change }) => (
                  <div className="file-row" key={`${transition.id}-${change.path}`}>
                    <span className={`file-status ${change.status}`}>{statusLabel(language, change.status).slice(0, 1)}</span>
                    <code>{change.path}</code>
                    <span>{transition.to.label}</span>
                    <small>{lineDeltaLabel(change)}</small>
                  </div>
                )) : <p className="empty-result">{c.filterNothing}</p>}
              </div>
            )}

            {view === 'export' && (
              <div className="export-view">
                <div className="export-toolbar">
                  <button className="primary-action" type="button" onClick={() => downloadText('LOCAL_CHANGELOG.txt', detailedReport)}>{c.downloadAll}<span>↓</span></button>
                  <button className="text-action" type="button" onClick={() => downloadText('git-time-machine-report.json', JSON.stringify(report, null, 2), 'application/json')}>{c.downloadJson}</button>
                </div>
                <pre>{detailedReport}</pre>
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <span>GIT TIME MACHINE / {c.buildLabel}</span>
        <span>{c.privacy}</span>
      </footer>
    </div>
  )
}

export default App
