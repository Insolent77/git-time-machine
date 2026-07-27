import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { analyzeSnapshots, formatBytes } from './lib/analyzer'
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
import {
  COPY,
  LANGUAGE_OPTIONS,
  buildLocalizedChangelog,
  buildLocalizedMarkdownReport,
  categoryLabel,
  commitDescription,
  commitTitle,
  fill,
  formatLocalizedDate,
  lineDeltaLabel,
  statusLabel,
  type Language,
} from './i18n'

type ArchiveItem = {
  id: string
  file: File
  label: string
  date: string
}

type Tab = 'timeline' | 'files' | 'report'
type StatusFilter = 'all' | ChangeStatus

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

function getInitialLanguage(): Language {
  const saved = window.localStorage.getItem('gtm-language')
  return LANGUAGE_OPTIONS.some((option) => option.code === saved) ? saved as Language : 'en'
}

function Metric({ value, label, index }: { value: string | number; label: string; index: string }) {
  return (
    <article className="metric">
      <span>{index}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  )
}

function ChangeBadge({ status, language }: { status: ChangeStatus; language: Language }) {
  return <span className={`status-label status-${status}`}>{statusLabel(language, status)}</span>
}

function CategoryBadge({ category, language }: { category: ChangeCategory; language: Language }) {
  return <span className="category-label">{categoryLabel(language, category)}</span>
}

function FileChangeRow({ change, language }: { change: FileChange; language: Language }) {
  return (
    <div className="file-change-row">
      <div className="file-main">
        <ChangeBadge status={change.status} language={language} />
        <code title={change.path}>{change.path}</code>
      </div>
      <div className="file-meta">
        <CategoryBadge category={change.category} language={language} />
        <span>{lineDeltaLabel(change, language, formatBytes)}</span>
      </div>
    </div>
  )
}

function TimelineTransition({ transition, language }: { transition: VersionTransition; language: Language }) {
  const c = COPY[language]

  return (
    <section className="timeline-transition">
      <div className="timeline-marker" aria-hidden="true">
        <span>{formatLocalizedDate(transition.to.capturedAt, language).slice(0, 2)}</span>
      </div>
      <div className="transition-body">
        <header className="transition-header">
          <div>
            <span className="micro-label">{c.version} / {formatLocalizedDate(transition.to.capturedAt, language)}</span>
            <h3>{transition.to.label}</h3>
            <p>{fill(c.inferredFrom, { from: transition.from.label, count: transition.commits.length })}</p>
          </div>
          <div className="transition-stats" aria-label="File changes">
            <span>+{transition.stats.filesAdded}</span>
            <span>~{transition.stats.filesModified}</span>
            <span>−{transition.stats.filesRemoved}</span>
          </div>
        </header>

        {transition.commits.length === 0 ? (
          <p className="empty-line">{c.noChanges}</p>
        ) : (
          <div className="commit-list">
            {transition.commits.map((commit, index) => (
              <details className="commit-row" key={commit.id} open={index === 0}>
                <summary>
                  <span className="commit-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="commit-copy">
                    <div>
                      <h4>{commitTitle(language, commit.category)}</h4>
                      <CategoryBadge category={commit.category} language={language} />
                    </div>
                    <p>{commitDescription(language, commit)}</p>
                  </div>
                  <div className="confidence" title={c.confidenceHint}>
                    <strong>{commit.confidence}</strong>
                    <span>% {c.confidence}</span>
                  </div>
                </summary>
                <div className="commit-files">
                  {commit.changes.map((change) => (
                    <FileChangeRow key={`${commit.id}-${change.path}`} change={change} language={language} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ArchiveSculpture({ language }: { language: Language }) {
  const c = COPY[language]
  return (
    <div className="archive-sculpture" aria-label={c.diagramLabel}>
      <svg className="connector-map" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
        <path d="M110 160 L500 310 L858 92" />
        <path d="M206 510 L500 340 L890 410" />
        <path d="M500 80 L500 610" />
        <path d="M500 330 L770 590" />
      </svg>

      <div className="map-node node-a"><i />V.01</div>
      <div className="map-node node-b"><i />SHA.256</div>
      <div className="map-node node-c"><i />Δ.033</div>
      <div className="map-node node-d"><i />MD.OUT</div>

      <div className="signal-cloud" aria-hidden="true">
        {Array.from({ length: 19 }, (_, index) => <span key={index} />)}
      </div>
      <div className="beam beam-a"><span>ARCHIVE / 01</span></div>
      <div className="beam beam-b"><span>ARCHIVE / 02</span></div>
      <div className="beam beam-c"><span>ARCHIVE / 03</span></div>
      <div className="core-node"><span>GTM</span><small>REBUILD</small></div>

      <div className="diagram-caption">
        <span>{c.diagramLabel}</span>
        <strong>NO. 02</strong>
      </div>
      <div className="diagram-legend">
        <span><b>01</b>{c.diagramVersion}</span>
        <span><b>02</b>{c.diagramFiles}</span>
        <span><b>03</b>{c.diagramCommits}</span>
        <span><b>04</b>{c.diagramConfidence}</span>
      </div>
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
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
  const c = COPY[language]

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem('gtm-language', language)
  }, [language])

  const changelog = useMemo(
    () => report ? buildLocalizedChangelog(report, language) : '',
    [report, language],
  )
  const markdownReport = useMemo(
    () => report ? buildLocalizedMarkdownReport(report, language, formatBytes) : '',
    [report, language],
  )

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

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage)
    setError(null)
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const zipFiles = incoming.filter((file) => file.name.toLowerCase().endsWith('.zip'))

    if (!zipFiles.length) {
      setError(c.zipOnlyError)
      return
    }

    setError(incoming.length === zipFiles.length ? null : c.someSkippedError)
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
      setError(c.minimumError)
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
    } catch {
      setError(c.analysisError)
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
      setError(c.copyError)
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
      <header className="poster-header">
        <a className="poster-brand" href="#top" aria-label="Git Time Machine">
          <span>GTM</span>
          <div><strong>Git Time Machine</strong><small>{c.brandSubtitle}</small></div>
        </a>
        <div className="header-code">{c.projectCode}<br /><span>CLIENT-SIDE / OPEN SOURCE</span></div>
        <nav className="language-switch" aria-label="Language">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              className={language === option.code ? 'active' : ''}
              type="button"
              title={option.name}
              aria-pressed={language === option.code}
              onClick={() => changeLanguage(option.code)}
            >
              {option.short}
            </button>
          ))}
        </nav>
        <a className="source-link" href="https://github.com/Insolent77/git-time-machine" target="_blank" rel="noreferrer">{c.sourceCode}</a>
      </header>

      <main id="top">
        <section className="poster-hero">
          <div className="hero-heading">
            <span className="hero-hash">#</span>
            <div>
              <p>{c.heroKicker}</p>
              <h1>{c.heroTitleA}<br /><em>{c.heroTitleB}</em></h1>
            </div>
          </div>

          <div className="hero-description">
            <span>{c.browserOnly}</span>
            <p>{c.heroText}</p>
            <div className="hero-actions">
              <a className="solid-action" href="#workspace">{c.uploadVersions}</a>
              <button className="line-action" type="button" onClick={runDemo}>{c.openDemo}</button>
            </div>
          </div>

          <div className="hero-features">
            <span><b>01</b>{c.zipProcessing}</span>
            <span><b>02</b>{c.hashCompare}</span>
            <span><b>03</b>{c.markdownExport}</span>
          </div>

          <ArchiveSculpture language={language} />
          <p className="vertical-claim">{c.verticalClaim}</p>

          <div className="protocol-strip">
            <div><small>{c.inputLabel}</small><strong>02+</strong><span>// {c.archivesUnit}</span></div>
            <div><small>{c.outputLabel}</small><strong>01</strong><span>// {c.historyUnit}</span></div>
          </div>
        </section>

        <section className="workspace" id="workspace">
          <aside className="section-index">
            <span>01</span>
            <small>{c.workspaceKicker}</small>
          </aside>
          <div className="section-content">
            <header className="section-header">
              <div><h2>{c.workspaceTitle}</h2><p>{c.workspaceText}</p></div>
              {archives.length > 0 && <button className="plain-link danger" type="button" onClick={reset}>{c.clearAll}</button>}
            </header>

            <div
              className={`dropzone ${dragging ? 'is-dragging' : ''}`}
              onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true) }}
              onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <div className="drop-symbol">[ + ]</div>
              <div><h3>{c.dropTitle}</h3><p>{c.dropText}</p></div>
              <label className="outline-action">
                {c.chooseArchives}
                <input type="file" accept=".zip,application/zip" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files && addFiles(event.target.files)} />
              </label>
              <small>{c.uploadLimit}</small>
            </div>

            {error && <div className="error-line"><strong>{c.errorPrefix}</strong> {error}</div>}

            {archives.length > 0 && (
              <div className="archive-editor">
                <div className="archive-editor-head">
                  <div><strong>{fill(c.selectedVersions, { count: archives.length })}</strong><span>{c.orderHint}</span></div>
                  <button className="plain-link" type="button" onClick={() => setArchives((items) => [...items].sort((left, right) => left.date.localeCompare(right.date)))}>{c.sortByDate}</button>
                </div>

                <div className="archive-list">
                  {archives.map((archive, index) => (
                    <div className="archive-row" key={archive.id}>
                      <div className="archive-order">
                        <strong>{String(index + 1).padStart(2, '0')}</strong>
                        <div>
                          <button type="button" disabled={index === 0} onClick={() => setArchives((items) => moveItem(items, index, index - 1))}>↑</button>
                          <button type="button" disabled={index === archives.length - 1} onClick={() => setArchives((items) => moveItem(items, index, index + 1))}>↓</button>
                        </div>
                      </div>
                      <div className="archive-file"><span>ZIP</span><div><strong>{archive.file.name}</strong><small>{formatBytes(archive.file.size)}</small></div></div>
                      <label><span>{c.versionName}</span><input value={archive.label} onChange={(event: ChangeEvent<HTMLInputElement>) => setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, label: event.target.value } : item))} /></label>
                      <label><span>{c.versionDate}</span><input type="date" value={archive.date} onChange={(event: ChangeEvent<HTMLInputElement>) => setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, date: event.target.value } : item))} /></label>
                      <button className="remove-archive" type="button" aria-label={fill(c.removeArchive, { name: archive.file.name })} onClick={() => setArchives((items) => items.filter((item) => item.id !== archive.id))}>×</button>
                    </div>
                  ))}
                </div>

                <div className="analysis-bar">
                  <div><strong>{archives.length >= 2 ? c.readyTitle : c.needAnotherTitle}</strong><span>{archives.length >= 2 ? c.readyText : c.needAnotherText}</span></div>
                  <button className="solid-action" type="button" disabled={busy || archives.length < 2} onClick={runAnalysis}>{busy ? c.analyzing : c.reconstruct}</button>
                </div>

                {busy && progress && (
                  <div className="progress-line">
                    <div><strong>{progress.archive}</strong><span>{progress.currentPath ?? c.finishing}</span></div>
                    <div className="progress-track"><span style={{ width: `${progress.total ? Math.round(progress.processed / progress.total * 100) : 0}%` }} /></div>
                    <small>{progress.processed} / {progress.total}</small>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {report && (
          <section className="results" id="results">
            <aside className="section-index"><span>02</span><small>{c.resultKicker}</small></aside>
            <div className="section-content">
              <header className="section-header result-header">
                <div><h2>{c.resultTitle}</h2><p>{c.resultText}</p></div>
                <div className="export-actions">
                  <button className="line-action" type="button" onClick={() => downloadText('git-time-machine-report.json', JSON.stringify(report, null, 2), 'application/json')}>JSON</button>
                  <button className="line-action" type="button" onClick={() => downloadText('ANALYSIS.md', markdownReport, 'text/markdown;charset=utf-8')}>{c.exportReport}</button>
                  <button className="solid-action" type="button" onClick={() => downloadText('CHANGELOG.md', changelog, 'text/markdown;charset=utf-8')}>{c.downloadChangelog}</button>
                </div>
              </header>

              <div className="metrics">
                <Metric index="01" value={report.snapshots.length} label={c.metricVersions} />
                <Metric index="02" value={report.totals.inferredCommits} label={c.metricCommits} />
                <Metric index="03" value={`+${report.totals.linesAdded}`} label={c.metricAdded} />
                <Metric index="04" value={`−${report.totals.linesRemoved}`} label={c.metricRemoved} />
                <Metric index="05" value={report.totals.analyzedFiles} label={c.metricFiles} />
              </div>

              <div className="result-nav" role="tablist">
                <button className={tab === 'timeline' ? 'active' : ''} type="button" onClick={() => setTab('timeline')}>01 / {c.tabTimeline}</button>
                <button className={tab === 'files' ? 'active' : ''} type="button" onClick={() => setTab('files')}>02 / {c.tabFiles}</button>
                <button className={tab === 'report' ? 'active' : ''} type="button" onClick={() => setTab('report')}>03 / {c.tabChangelog}</button>
              </div>

              {tab === 'timeline' && (
                <div className="timeline">
                  <div className="timeline-origin">
                    <div className="timeline-marker origin"><span>00</span></div>
                    <div><span className="micro-label">{c.sourceVersion} / {formatLocalizedDate(report.snapshots[0].capturedAt, language)}</span><h3>{report.snapshots[0].label}</h3><p>{Object.keys(report.snapshots[0].files).length} {c.filesWord} · {formatBytes(report.snapshots[0].totalBytes)}</p></div>
                  </div>
                  {report.transitions.map((transition) => <TimelineTransition key={transition.id} transition={transition} language={language} />)}
                </div>
              )}

              {tab === 'files' && (
                <div className="files-view">
                  <div className="files-toolbar">
                    <input placeholder={c.searchPlaceholder} value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} />
                    <div>
                      {(['all', 'added', 'modified', 'removed'] as StatusFilter[]).map((status) => (
                        <button key={status} className={statusFilter === status ? 'active' : ''} type="button" onClick={() => setStatusFilter(status)}>{status === 'all' ? c.filterAll : statusLabel(language, status)}</button>
                      ))}
                    </div>
                  </div>
                  {filteredTransitions.length ? filteredTransitions.map((transition) => (
                    <section className="file-group" key={transition.id}>
                      <header><strong>{transition.from.label} → {transition.to.label}</strong><span>{fill(c.changesWord, { count: transition.changes.length })}</span></header>
                      <div>{transition.changes.map((change) => <FileChangeRow key={`${transition.id}-${change.path}`} change={change} language={language} />)}</div>
                    </section>
                  )) : <div className="empty-line">{c.nothingFound}</div>}
                </div>
              )}

              {tab === 'report' && (
                <div className="report-view">
                  <div className="report-toolbar"><div><strong>CHANGELOG.md</strong><span>{c.changelogDraft}</span></div><button className="line-action" type="button" onClick={copyChangelog}>{copied ? c.copied : c.copy}</button></div>
                  <pre>{changelog}</pre>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="method-section">
          <aside className="section-index"><span>03</span><small>{c.methodKicker}</small></aside>
          <div className="section-content">
            <header className="section-header"><div><h2>{c.methodTitle}</h2></div></header>
            <div className="method-list">
              <article><span>01</span><h3>{c.step1Title}</h3><p>{c.step1Text}</p></article>
              <article><span>02</span><h3>{c.step2Title}</h3><p>{c.step2Text}</p></article>
              <article><span>03</span><h3>{c.step3Title}</h3><p>{c.step3Text}</p></article>
              <article><span>04</span><h3>{c.step4Title}</h3><p>{c.step4Text}</p></article>
            </div>
          </div>
        </section>
      </main>

      <footer className="poster-footer">
        <div><strong>GIT TIME MACHINE</strong><span>OPEN SOURCE / MIT</span></div>
        <p>{c.footerPrivacy}</p>
        <span>BUILD 0.2.0 / 2026</span>
      </footer>
    </div>
  )
}

export default App
