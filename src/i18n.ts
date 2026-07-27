import type { AnalysisReport, ChangeCategory, ChangeStatus, FileChange, InferredCommit } from './lib/types'

export type Language = 'en' | 'ru' | 'zh' | 'de' | 'es'

export const LANGUAGE_OPTIONS: Array<{ code: Language; short: string; name: string }> = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ru', short: 'RU', name: 'Русский' },
  { code: 'zh', short: '中文', name: '中文' },
  { code: 'de', short: 'DE', name: 'Deutsch' },
  { code: 'es', short: 'ES', name: 'Español' },
]

export const LOCALES: Record<Language, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  zh: 'zh-CN',
  de: 'de-DE',
  es: 'es-ES',
}

type Copy = {
  brandSubtitle: string
  browserOnly: string
  sourceCode: string
  projectCode: string
  heroKicker: string
  heroTitleA: string
  heroTitleB: string
  heroText: string
  uploadVersions: string
  openDemo: string
  zipProcessing: string
  hashCompare: string
  markdownExport: string
  diagramLabel: string
  diagramVersion: string
  diagramFiles: string
  diagramCommits: string
  diagramConfidence: string
  verticalClaim: string
  inputLabel: string
  outputLabel: string
  archivesUnit: string
  historyUnit: string
  workspaceKicker: string
  workspaceTitle: string
  workspaceText: string
  clearAll: string
  dropTitle: string
  dropText: string
  chooseArchives: string
  uploadLimit: string
  errorPrefix: string
  zipOnlyError: string
  someSkippedError: string
  minimumError: string
  analysisError: string
  copyError: string
  selectedVersions: string
  orderHint: string
  sortByDate: string
  versionName: string
  versionDate: string
  removeArchive: string
  readyTitle: string
  needAnotherTitle: string
  readyText: string
  needAnotherText: string
  analyzing: string
  reconstruct: string
  finishing: string
  resultKicker: string
  resultTitle: string
  resultText: string
  exportReport: string
  downloadChangelog: string
  metricVersions: string
  metricCommits: string
  metricAdded: string
  metricRemoved: string
  metricFiles: string
  tabTimeline: string
  tabFiles: string
  tabChangelog: string
  sourceVersion: string
  version: string
  filesWord: string
  inferredFrom: string
  noChanges: string
  confidence: string
  confidenceHint: string
  noLineChange: string
  searchPlaceholder: string
  filterAll: string
  changesWord: string
  nothingFound: string
  changelogDraft: string
  copied: string
  copy: string
  methodKicker: string
  methodTitle: string
  step1Title: string
  step1Text: string
  step2Title: string
  step2Text: string
  step3Title: string
  step3Text: string
  step4Title: string
  step4Text: string
  footerPrivacy: string
  reconstructedChangelog: string
  changelogDisclaimer: string
  noFileChanges: string
  confidenceLabel: string
  keyFiles: string
  addedFiles: string
  modifiedFiles: string
  removedFiles: string
  relatedFilesUpdated: string
  moreFiles: string
  analysisTitle: string
  generated: string
  summary: string
  snapshots: string
  inferredCommits: string
  filesAdded: string
  filesModified: string
  filesRemoved: string
  linesAdded: string
  linesRemoved: string
  snapshotInventory: string
  source: string
}

export const COPY: Record<Language, Copy> = {
  en: {
    brandSubtitle: 'archive reconstruction system', browserOnly: '100% local', sourceCode: 'Source ↗', projectCode: '[ARCHIVE.LAB] / BUILD 002',
    heroKicker: 'CERTAIN / UNCERTAIN DEVELOPMENT STATES × 03', heroTitleA: 'CODE HISTORY', heroTitleB: 'RECONSTRUCTED',
    heroText: 'Load dated ZIP snapshots. The system compares files, infers development stages and produces a reviewable changelog without sending source code to a server.',
    uploadVersions: 'Load versions', openDemo: 'Run experiment', zipProcessing: 'ZIP processing', hashCompare: 'SHA-256 comparison', markdownExport: 'Markdown output',
    diagramLabel: 'RECONSTRUCTION PROGRAM', diagramVersion: 'VERSION', diagramFiles: 'FILES', diagramCommits: 'COMMITS', diagramConfidence: 'CONFIDENCE',
    verticalClaim: 'Turn scattered archives into one readable development history', inputLabel: 'INPUT PROTOCOL', outputLabel: 'OUTPUT MODEL', archivesUnit: 'ARCHIVES', historyUnit: 'TIMELINE',
    workspaceKicker: 'CORE PARAMETERS', workspaceTitle: 'Load project versions', workspaceText: 'Use ZIP archives from different dates. Dependencies and generated folders are ignored automatically.', clearAll: 'Clear all',
    dropTitle: 'Drop ZIP archives here', dropText: 'or select several files from your computer', chooseArchives: 'Choose archives', uploadLimit: 'Up to 200 MB each · files stay on this device',
    errorPrefix: 'Check input:', zipOnlyError: 'Choose standard ZIP archives. RAR and 7z are planned for later versions.', someSkippedError: 'Some files were skipped: only ZIP is supported now.',
    minimumError: 'Add at least two project versions to reconstruct a change history.', analysisError: 'The archives could not be analyzed.', copyError: 'Clipboard access was blocked. Download CHANGELOG.md instead.',
    selectedVersions: 'Selected versions: {count}', orderHint: 'Date defines chronology. The label becomes the version heading.', sortByDate: 'Sort by date', versionName: 'Version label', versionDate: 'Capture date', removeArchive: 'Remove {name}',
    readyTitle: 'Comparison protocol ready', needAnotherTitle: 'One more version required', readyText: 'Analysis runs locally and may take time for large archives.', needAnotherText: 'Two snapshots are the minimum needed to detect changes.', analyzing: 'Analyzing…', reconstruct: 'Reconstruct history', finishing: 'Finalizing archive',
    resultKicker: 'EXPERIMENT OUTPUT', resultTitle: 'Plausible development history', resultText: 'This is a reconstruction, not verified Git history. Review wording before publishing.', exportReport: 'Report', downloadChangelog: 'Download CHANGELOG',
    metricVersions: 'project versions', metricCommits: 'inferred commits', metricAdded: 'lines added', metricRemoved: 'lines removed', metricFiles: 'files processed',
    tabTimeline: 'Timeline', tabFiles: 'File changes', tabChangelog: 'CHANGELOG', sourceVersion: 'Source version', version: 'Version', filesWord: 'files', inferredFrom: 'From “{from}” the system inferred {count} commits.', noChanges: 'No changes detected between these archives.', confidence: 'confidence', confidenceHint: 'Estimated from file paths and category signals', noLineChange: 'no line delta',
    searchPlaceholder: 'Search file path…', filterAll: 'All', changesWord: '{count} changes', nothingFound: 'Nothing matches the selected filter.', changelogDraft: 'Reviewable repository draft', copied: 'Copied ✓', copy: 'Copy',
    methodKicker: 'METHOD', methodTitle: 'Four stages. No hidden magic.', step1Title: 'Read archives', step1Text: 'JSZip opens snapshots locally and removes dependency or build directories.', step2Title: 'Compare states', step2Text: 'SHA-256 finds changed files while text analysis estimates added and removed lines.', step3Title: 'Infer stages', step3Text: 'Changes are grouped into auth, database, API, interface, tests and other project areas.', step4Title: 'Export evidence', step4Text: 'Download a changelog, a complete Markdown report or machine-readable JSON.',
    footerPrivacy: 'Source files are processed only inside your browser.', reconstructedChangelog: 'Reconstructed changelog', changelogDisclaimer: 'Generated by Git Time Machine. Commit grouping is inferred and should be reviewed before use.', noFileChanges: 'No file changes detected.', confidenceLabel: 'Confidence', keyFiles: 'Key files', addedFiles: 'files added', modifiedFiles: 'modified', removedFiles: 'removed', relatedFilesUpdated: 'related files updated', moreFiles: 'and {count} more files',
    analysisTitle: 'Git Time Machine analysis', generated: 'Generated', summary: 'Summary', snapshots: 'Snapshots', inferredCommits: 'Inferred commits', filesAdded: 'Files added', filesModified: 'Files modified', filesRemoved: 'Files removed', linesAdded: 'Lines added', linesRemoved: 'Lines removed', snapshotInventory: 'Snapshot inventory', source: 'source',
  },
  ru: {
    brandSubtitle: 'система реконструкции архивов', browserOnly: '100% локально', sourceCode: 'Исходники ↗', projectCode: '[ARCHIVE.LAB] / СБОРКА 002',
    heroKicker: 'ОПРЕДЕЛЁННЫЕ / НЕОПРЕДЕЛЁННЫЕ СОСТОЯНИЯ КОДА × 03', heroTitleA: 'ИСТОРИЯ КОДА', heroTitleB: 'ВОССТАНОВЛЕНА',
    heroText: 'Загрузите ZIP-снимки проекта из разных дат. Система сравнит файлы, восстановит вероятные этапы разработки и подготовит проверяемый CHANGELOG без отправки исходников на сервер.',
    uploadVersions: 'Загрузить версии', openDemo: 'Запустить эксперимент', zipProcessing: 'Обработка ZIP', hashCompare: 'Сравнение SHA-256', markdownExport: 'Экспорт Markdown',
    diagramLabel: 'ПРОГРАММА РЕКОНСТРУКЦИИ', diagramVersion: 'ВЕРСИЯ', diagramFiles: 'ФАЙЛЫ', diagramCommits: 'КОММИТЫ', diagramConfidence: 'УВЕРЕННОСТЬ',
    verticalClaim: 'Превращаем разрозненные архивы в понятную историю разработки', inputLabel: 'ВХОДНОЙ ПРОТОКОЛ', outputLabel: 'ВЫХОДНАЯ МОДЕЛЬ', archivesUnit: 'АРХИВА', historyUnit: 'ХРОНОЛОГИЯ',
    workspaceKicker: 'ОСНОВНЫЕ ПАРАМЕТРЫ', workspaceTitle: 'Добавьте версии проекта', workspaceText: 'Используйте ZIP-архивы из разных дат. Зависимости и сборочные каталоги исключаются автоматически.', clearAll: 'Очистить всё',
    dropTitle: 'Перетащите ZIP-архивы сюда', dropText: 'или выберите несколько файлов на компьютере', chooseArchives: 'Выбрать архивы', uploadLimit: 'До 200 МБ каждый · файлы остаются на устройстве',
    errorPrefix: 'Проверьте данные:', zipOnlyError: 'Выберите обычные ZIP-архивы. RAR и 7z появятся в следующих версиях.', someSkippedError: 'Некоторые файлы пропущены: сейчас поддерживается только ZIP.',
    minimumError: 'Добавьте минимум две версии проекта, чтобы построить историю изменений.', analysisError: 'Не удалось проанализировать архивы.', copyError: 'Браузер запретил копирование. Скачайте CHANGELOG.md.',
    selectedVersions: 'Выбрано версий: {count}', orderHint: 'Дата определяет хронологию. Название станет заголовком версии.', sortByDate: 'Сортировать по дате', versionName: 'Название версии', versionDate: 'Дата версии', removeArchive: 'Удалить {name}',
    readyTitle: 'Протокол сравнения готов', needAnotherTitle: 'Нужна ещё одна версия', readyText: 'Анализ выполняется локально и может занять время на больших архивах.', needAnotherText: 'Минимум два снимка позволяют определить изменения.', analyzing: 'Анализируем…', reconstruct: 'Восстановить историю', finishing: 'Завершаем обработку',
    resultKicker: 'РЕЗУЛЬТАТ ЭКСПЕРИМЕНТА', resultTitle: 'Предполагаемая история разработки', resultText: 'Это реконструкция, а не подтверждённая Git-история. Проверьте формулировки перед публикацией.', exportReport: 'Отчёт', downloadChangelog: 'Скачать CHANGELOG',
    metricVersions: 'версий проекта', metricCommits: 'предполагаемых коммитов', metricAdded: 'добавлено строк', metricRemoved: 'удалено строк', metricFiles: 'файлов обработано',
    tabTimeline: 'Хронология', tabFiles: 'Изменения файлов', tabChangelog: 'CHANGELOG', sourceVersion: 'Исходная версия', version: 'Версия', filesWord: 'файлов', inferredFrom: 'Из «{from}» восстановлено {count} предполагаемых коммитов.', noChanges: 'Изменения между архивами не обнаружены.', confidence: 'уверенность', confidenceHint: 'Оценка по путям файлов и сигналам категорий', noLineChange: 'без изменения строк',
    searchPlaceholder: 'Поиск по пути файла…', filterAll: 'Все', changesWord: 'Изменений: {count}', nothingFound: 'По выбранному фильтру ничего не найдено.', changelogDraft: 'Черновик для репозитория', copied: 'Скопировано ✓', copy: 'Копировать',
    methodKicker: 'МЕТОД', methodTitle: 'Четыре этапа. Никакой скрытой магии.', step1Title: 'Читаем архивы', step1Text: 'JSZip распаковывает снимки локально и исключает зависимости и сборочные каталоги.', step2Title: 'Сравниваем состояния', step2Text: 'SHA-256 определяет изменённые файлы, а анализ текста оценивает добавленные и удалённые строки.', step3Title: 'Восстанавливаем этапы', step3Text: 'Изменения группируются по авторизации, БД, API, интерфейсу, тестам и другим областям.', step4Title: 'Экспортируем результат', step4Text: 'Скачайте CHANGELOG, полный Markdown-отчёт или машиночитаемый JSON.',
    footerPrivacy: 'Исходные файлы обрабатываются только внутри вашего браузера.', reconstructedChangelog: 'Восстановленный журнал изменений', changelogDisclaimer: 'Создано Git Time Machine. Группировка коммитов является предположением и требует проверки.', noFileChanges: 'Изменения файлов не обнаружены.', confidenceLabel: 'Уверенность', keyFiles: 'Ключевые файлы', addedFiles: 'добавлено файлов', modifiedFiles: 'изменено', removedFiles: 'удалено', relatedFilesUpdated: 'обновлены связанные файлы', moreFiles: 'и ещё файлов: {count}',
    analysisTitle: 'Анализ Git Time Machine', generated: 'Создано', summary: 'Сводка', snapshots: 'Снимков', inferredCommits: 'Предполагаемых коммитов', filesAdded: 'Добавлено файлов', filesModified: 'Изменено файлов', filesRemoved: 'Удалено файлов', linesAdded: 'Добавлено строк', linesRemoved: 'Удалено строк', snapshotInventory: 'Состав снимков', source: 'источник',
  },
  zh: {
    brandSubtitle: '代码归档重建系统', browserOnly: '100% 本地处理', sourceCode: '源代码 ↗', projectCode: '[ARCHIVE.LAB] / 构建 002',
    heroKicker: '确定 / 不确定的代码状态 × 03', heroTitleA: '代码历史', heroTitleB: '重建完成', heroText: '上传不同日期的 ZIP 项目快照。系统比较文件、推断开发阶段并生成可审阅的更新日志，源代码不会上传到服务器。',
    uploadVersions: '上传版本', openDemo: '运行实验', zipProcessing: 'ZIP 处理', hashCompare: 'SHA-256 比较', markdownExport: 'Markdown 导出', diagramLabel: '重建程序', diagramVersion: '版本', diagramFiles: '文件', diagramCommits: '提交', diagramConfidence: '置信度', verticalClaim: '把分散的项目归档转化为清晰的开发历史', inputLabel: '输入协议', outputLabel: '输出模型', archivesUnit: '个归档', historyUnit: '时间线',
    workspaceKicker: '核心参数', workspaceTitle: '添加项目版本', workspaceText: '请选择不同日期的 ZIP 归档。依赖与构建目录会自动忽略。', clearAll: '全部清除', dropTitle: '将 ZIP 归档拖到这里', dropText: '或从电脑选择多个文件', chooseArchives: '选择归档', uploadLimit: '每个最多 200 MB · 文件仅保留在本机', errorPrefix: '请检查输入：', zipOnlyError: '请选择标准 ZIP 归档。RAR 和 7z 将在后续版本支持。', someSkippedError: '部分文件已跳过：目前仅支持 ZIP。', minimumError: '至少添加两个项目版本才能重建变更历史。', analysisError: '无法分析归档。', copyError: '浏览器阻止了复制，请下载 CHANGELOG.md。', selectedVersions: '已选择版本：{count}', orderHint: '日期决定时间顺序，标签将作为版本标题。', sortByDate: '按日期排序', versionName: '版本名称', versionDate: '版本日期', removeArchive: '删除 {name}', readyTitle: '比较协议已就绪', needAnotherTitle: '还需要一个版本', readyText: '分析在本机运行，大型归档可能需要一些时间。', needAnotherText: '至少两个快照才能检测变化。', analyzing: '分析中…', reconstruct: '重建历史', finishing: '正在完成处理', resultKicker: '实验输出', resultTitle: '推测的开发历史', resultText: '这是重建结果，不是经过验证的 Git 历史。发布前请审阅文本。', exportReport: '报告', downloadChangelog: '下载 CHANGELOG', metricVersions: '项目版本', metricCommits: '推断提交', metricAdded: '新增行', metricRemoved: '删除行', metricFiles: '处理文件', tabTimeline: '时间线', tabFiles: '文件变更', tabChangelog: 'CHANGELOG', sourceVersion: '初始版本', version: '版本', filesWord: '个文件', inferredFrom: '从“{from}”推断出 {count} 个提交。', noChanges: '归档之间未检测到变化。', confidence: '置信度', confidenceHint: '根据文件路径和分类信号估算', noLineChange: '无行变化', searchPlaceholder: '搜索文件路径…', filterAll: '全部', changesWord: '{count} 项变更', nothingFound: '没有符合筛选条件的结果。', changelogDraft: '可审阅的仓库草稿', copied: '已复制 ✓', copy: '复制', methodKicker: '方法', methodTitle: '四个阶段，没有隐藏魔法。', step1Title: '读取归档', step1Text: 'JSZip 在本地解压快照并排除依赖和构建目录。', step2Title: '比较状态', step2Text: 'SHA-256 查找变更文件，文本分析估算新增和删除行。', step3Title: '推断阶段', step3Text: '变更按认证、数据库、API、界面、测试等项目区域分组。', step4Title: '导出证据', step4Text: '下载更新日志、完整 Markdown 报告或 JSON。', footerPrivacy: '源文件仅在浏览器内部处理。', reconstructedChangelog: '重建更新日志', changelogDisclaimer: '由 Git Time Machine 生成。提交分组为推断结果，使用前请审阅。', noFileChanges: '未检测到文件变更。', confidenceLabel: '置信度', keyFiles: '关键文件', addedFiles: '新增文件', modifiedFiles: '修改', removedFiles: '删除', relatedFilesUpdated: '相关文件已更新', moreFiles: '以及另外 {count} 个文件', analysisTitle: 'Git Time Machine 分析', generated: '生成时间', summary: '摘要', snapshots: '快照', inferredCommits: '推断提交', filesAdded: '新增文件', filesModified: '修改文件', filesRemoved: '删除文件', linesAdded: '新增行', linesRemoved: '删除行', snapshotInventory: '快照清单', source: '来源',
  },
  de: {
    brandSubtitle: 'System zur Archivreonstruktion', browserOnly: '100% lokal', sourceCode: 'Quellcode ↗', projectCode: '[ARCHIVE.LAB] / BUILD 002', heroKicker: 'BESTIMMTE / UNBESTIMMTE CODEZUSTÄNDE × 03', heroTitleA: 'CODEGESCHICHTE', heroTitleB: 'REKONSTRUIERT', heroText: 'Lade datierte ZIP-Snapshots. Das System vergleicht Dateien, leitet Entwicklungsphasen ab und erstellt ein prüfbares Changelog, ohne Quellcode an einen Server zu senden.', uploadVersions: 'Versionen laden', openDemo: 'Experiment starten', zipProcessing: 'ZIP-Verarbeitung', hashCompare: 'SHA-256-Vergleich', markdownExport: 'Markdown-Export', diagramLabel: 'REKONSTRUKTIONSPROGRAMM', diagramVersion: 'VERSION', diagramFiles: 'DATEIEN', diagramCommits: 'COMMITS', diagramConfidence: 'SICHERHEIT', verticalClaim: 'Verstreute Archive werden zu einer lesbaren Entwicklungsgeschichte', inputLabel: 'EINGABEPROTOKOLL', outputLabel: 'AUSGABEMODELL', archivesUnit: 'ARCHIVE', historyUnit: 'ZEITLEISTE', workspaceKicker: 'KERNPARAMETER', workspaceTitle: 'Projektversionen hinzufügen', workspaceText: 'Nutze ZIP-Archive aus verschiedenen Zeitpunkten. Abhängigkeiten und Build-Ordner werden automatisch ignoriert.', clearAll: 'Alles löschen', dropTitle: 'ZIP-Archive hier ablegen', dropText: 'oder mehrere Dateien vom Computer auswählen', chooseArchives: 'Archive wählen', uploadLimit: 'Bis 200 MB je Archiv · Dateien bleiben auf diesem Gerät', errorPrefix: 'Eingabe prüfen:', zipOnlyError: 'Bitte normale ZIP-Archive wählen. RAR und 7z folgen später.', someSkippedError: 'Einige Dateien wurden übersprungen: derzeit wird nur ZIP unterstützt.', minimumError: 'Mindestens zwei Projektversionen sind für die Rekonstruktion nötig.', analysisError: 'Die Archive konnten nicht analysiert werden.', copyError: 'Der Browser hat das Kopieren blockiert. Bitte CHANGELOG.md herunterladen.', selectedVersions: 'Ausgewählte Versionen: {count}', orderHint: 'Das Datum definiert die Reihenfolge. Die Bezeichnung wird zur Versionsüberschrift.', sortByDate: 'Nach Datum sortieren', versionName: 'Versionsname', versionDate: 'Versionsdatum', removeArchive: '{name} entfernen', readyTitle: 'Vergleichsprotokoll bereit', needAnotherTitle: 'Noch eine Version erforderlich', readyText: 'Die Analyse läuft lokal und kann bei großen Archiven dauern.', needAnotherText: 'Zwei Snapshots sind das Minimum zur Erkennung von Änderungen.', analyzing: 'Analyse…', reconstruct: 'Historie rekonstruieren', finishing: 'Verarbeitung abschließen', resultKicker: 'EXPERIMENTAUSGABE', resultTitle: 'Plausible Entwicklungsgeschichte', resultText: 'Dies ist eine Rekonstruktion, keine verifizierte Git-Historie. Texte vor Veröffentlichung prüfen.', exportReport: 'Bericht', downloadChangelog: 'CHANGELOG laden', metricVersions: 'Projektversionen', metricCommits: 'abgeleitete Commits', metricAdded: 'Zeilen hinzugefügt', metricRemoved: 'Zeilen entfernt', metricFiles: 'Dateien verarbeitet', tabTimeline: 'Zeitleiste', tabFiles: 'Dateiänderungen', tabChangelog: 'CHANGELOG', sourceVersion: 'Ausgangsversion', version: 'Version', filesWord: 'Dateien', inferredFrom: 'Aus „{from}“ wurden {count} Commits abgeleitet.', noChanges: 'Keine Änderungen zwischen den Archiven erkannt.', confidence: 'Sicherheit', confidenceHint: 'Schätzung aus Dateipfaden und Kategoriesignalen', noLineChange: 'keine Zeilendifferenz', searchPlaceholder: 'Dateipfad suchen…', filterAll: 'Alle', changesWord: '{count} Änderungen', nothingFound: 'Keine Treffer für den gewählten Filter.', changelogDraft: 'Prüfbarer Entwurf für das Repository', copied: 'Kopiert ✓', copy: 'Kopieren', methodKicker: 'METHODE', methodTitle: 'Vier Phasen. Keine versteckte Magie.', step1Title: 'Archive lesen', step1Text: 'JSZip öffnet Snapshots lokal und schließt Abhängigkeits- und Build-Ordner aus.', step2Title: 'Zustände vergleichen', step2Text: 'SHA-256 erkennt geänderte Dateien; Textanalyse schätzt hinzugefügte und entfernte Zeilen.', step3Title: 'Phasen ableiten', step3Text: 'Änderungen werden Auth, Datenbank, API, UI, Tests und weiteren Bereichen zugeordnet.', step4Title: 'Ergebnis exportieren', step4Text: 'Changelog, vollständigen Markdown-Bericht oder JSON herunterladen.', footerPrivacy: 'Quelldateien werden ausschließlich im Browser verarbeitet.', reconstructedChangelog: 'Rekonstruiertes Changelog', changelogDisclaimer: 'Erzeugt mit Git Time Machine. Die Commit-Gruppierung ist abgeleitet und sollte geprüft werden.', noFileChanges: 'Keine Dateiänderungen erkannt.', confidenceLabel: 'Sicherheit', keyFiles: 'Wichtige Dateien', addedFiles: 'Dateien hinzugefügt', modifiedFiles: 'geändert', removedFiles: 'entfernt', relatedFilesUpdated: 'zugehörige Dateien aktualisiert', moreFiles: 'und {count} weitere Dateien', analysisTitle: 'Git-Time-Machine-Analyse', generated: 'Erstellt', summary: 'Zusammenfassung', snapshots: 'Snapshots', inferredCommits: 'Abgeleitete Commits', filesAdded: 'Dateien hinzugefügt', filesModified: 'Dateien geändert', filesRemoved: 'Dateien entfernt', linesAdded: 'Zeilen hinzugefügt', linesRemoved: 'Zeilen entfernt', snapshotInventory: 'Snapshot-Inventar', source: 'Quelle',
  },
  es: {
    brandSubtitle: 'sistema de reconstrucción de archivos', browserOnly: '100% local', sourceCode: 'Código ↗', projectCode: '[ARCHIVE.LAB] / BUILD 002', heroKicker: 'ESTADOS DE CÓDIGO CIERTOS / INCIERTOS × 03', heroTitleA: 'HISTORIA DEL CÓDIGO', heroTitleB: 'RECONSTRUIDA', heroText: 'Carga instantáneas ZIP de distintas fechas. El sistema compara archivos, infiere etapas de desarrollo y genera un registro revisable sin enviar el código fuente a un servidor.', uploadVersions: 'Cargar versiones', openDemo: 'Ejecutar experimento', zipProcessing: 'Procesamiento ZIP', hashCompare: 'Comparación SHA-256', markdownExport: 'Exportación Markdown', diagramLabel: 'PROGRAMA DE RECONSTRUCCIÓN', diagramVersion: 'VERSIÓN', diagramFiles: 'ARCHIVOS', diagramCommits: 'COMMITS', diagramConfidence: 'CONFIANZA', verticalClaim: 'Convierte archivos dispersos en una historia de desarrollo legible', inputLabel: 'PROTOCOLO DE ENTRADA', outputLabel: 'MODELO DE SALIDA', archivesUnit: 'ARCHIVOS', historyUnit: 'LÍNEA TEMPORAL', workspaceKicker: 'PARÁMETROS PRINCIPALES', workspaceTitle: 'Añade versiones del proyecto', workspaceText: 'Usa archivos ZIP de distintas fechas. Las dependencias y carpetas de compilación se ignoran automáticamente.', clearAll: 'Borrar todo', dropTitle: 'Suelta aquí los archivos ZIP', dropText: 'o selecciona varios archivos del equipo', chooseArchives: 'Elegir archivos', uploadLimit: 'Hasta 200 MB cada uno · los archivos permanecen en este dispositivo', errorPrefix: 'Revisa los datos:', zipOnlyError: 'Selecciona archivos ZIP estándar. RAR y 7z llegarán en futuras versiones.', someSkippedError: 'Algunos archivos se omitieron: por ahora solo se admite ZIP.', minimumError: 'Añade al menos dos versiones para reconstruir el historial.', analysisError: 'No se pudieron analizar los archivos.', copyError: 'El navegador bloqueó la copia. Descarga CHANGELOG.md.', selectedVersions: 'Versiones seleccionadas: {count}', orderHint: 'La fecha define la cronología. El nombre será el encabezado de versión.', sortByDate: 'Ordenar por fecha', versionName: 'Nombre de versión', versionDate: 'Fecha de versión', removeArchive: 'Eliminar {name}', readyTitle: 'Protocolo de comparación listo', needAnotherTitle: 'Falta una versión', readyText: 'El análisis se ejecuta localmente y puede tardar con archivos grandes.', needAnotherText: 'Se necesitan al menos dos instantáneas para detectar cambios.', analyzing: 'Analizando…', reconstruct: 'Reconstruir historial', finishing: 'Finalizando procesamiento', resultKicker: 'SALIDA DEL EXPERIMENTO', resultTitle: 'Historia de desarrollo plausible', resultText: 'Es una reconstrucción, no un historial Git verificado. Revisa el texto antes de publicarlo.', exportReport: 'Informe', downloadChangelog: 'Descargar CHANGELOG', metricVersions: 'versiones del proyecto', metricCommits: 'commits inferidos', metricAdded: 'líneas añadidas', metricRemoved: 'líneas eliminadas', metricFiles: 'archivos procesados', tabTimeline: 'Cronología', tabFiles: 'Cambios de archivos', tabChangelog: 'CHANGELOG', sourceVersion: 'Versión inicial', version: 'Versión', filesWord: 'archivos', inferredFrom: 'Desde «{from}» se infirieron {count} commits.', noChanges: 'No se detectaron cambios entre los archivos.', confidence: 'confianza', confidenceHint: 'Estimación basada en rutas y señales de categoría', noLineChange: 'sin cambios de líneas', searchPlaceholder: 'Buscar ruta de archivo…', filterAll: 'Todos', changesWord: '{count} cambios', nothingFound: 'No hay resultados para el filtro seleccionado.', changelogDraft: 'Borrador revisable para el repositorio', copied: 'Copiado ✓', copy: 'Copiar', methodKicker: 'MÉTODO', methodTitle: 'Cuatro etapas. Sin magia oculta.', step1Title: 'Leer archivos', step1Text: 'JSZip abre las instantáneas localmente y excluye dependencias y carpetas de compilación.', step2Title: 'Comparar estados', step2Text: 'SHA-256 detecta archivos modificados y el análisis de texto estima líneas añadidas o eliminadas.', step3Title: 'Inferir etapas', step3Text: 'Los cambios se agrupan por autenticación, base de datos, API, interfaz, pruebas y otras áreas.', step4Title: 'Exportar evidencia', step4Text: 'Descarga el changelog, un informe Markdown completo o JSON.', footerPrivacy: 'Los archivos fuente se procesan únicamente dentro del navegador.', reconstructedChangelog: 'Registro de cambios reconstruido', changelogDisclaimer: 'Generado por Git Time Machine. La agrupación de commits es inferida y debe revisarse.', noFileChanges: 'No se detectaron cambios de archivos.', confidenceLabel: 'Confianza', keyFiles: 'Archivos clave', addedFiles: 'archivos añadidos', modifiedFiles: 'modificados', removedFiles: 'eliminados', relatedFilesUpdated: 'archivos relacionados actualizados', moreFiles: 'y {count} archivos más', analysisTitle: 'Análisis de Git Time Machine', generated: 'Generado', summary: 'Resumen', snapshots: 'Instantáneas', inferredCommits: 'Commits inferidos', filesAdded: 'Archivos añadidos', filesModified: 'Archivos modificados', filesRemoved: 'Archivos eliminados', linesAdded: 'Líneas añadidas', linesRemoved: 'Líneas eliminadas', snapshotInventory: 'Inventario de instantáneas', source: 'origen',
  },
}

const CATEGORY_LABELS: Record<Language, Record<ChangeCategory, string>> = {
  en: { auth: 'Authentication', database: 'Database', admin: 'Admin', api: 'API', ui: 'Interface', styles: 'Styles', tests: 'Tests', docs: 'Documentation', config: 'Configuration', deps: 'Dependencies', assets: 'Assets', other: 'Logic' },
  ru: { auth: 'Авторизация', database: 'База данных', admin: 'Админка', api: 'API', ui: 'Интерфейс', styles: 'Стили', tests: 'Тесты', docs: 'Документация', config: 'Конфигурация', deps: 'Зависимости', assets: 'Ресурсы', other: 'Логика' },
  zh: { auth: '身份验证', database: '数据库', admin: '管理后台', api: 'API', ui: '界面', styles: '样式', tests: '测试', docs: '文档', config: '配置', deps: '依赖', assets: '资源', other: '逻辑' },
  de: { auth: 'Authentifizierung', database: 'Datenbank', admin: 'Administration', api: 'API', ui: 'Oberfläche', styles: 'Stile', tests: 'Tests', docs: 'Dokumentation', config: 'Konfiguration', deps: 'Abhängigkeiten', assets: 'Ressourcen', other: 'Logik' },
  es: { auth: 'Autenticación', database: 'Base de datos', admin: 'Administración', api: 'API', ui: 'Interfaz', styles: 'Estilos', tests: 'Pruebas', docs: 'Documentación', config: 'Configuración', deps: 'Dependencias', assets: 'Recursos', other: 'Lógica' },
}

const STATUS_LABELS: Record<Language, Record<ChangeStatus, string>> = {
  en: { added: 'Added', modified: 'Modified', removed: 'Removed' },
  ru: { added: 'Добавлен', modified: 'Изменён', removed: 'Удалён' },
  zh: { added: '新增', modified: '修改', removed: '删除' },
  de: { added: 'Hinzugefügt', modified: 'Geändert', removed: 'Entfernt' },
  es: { added: 'Añadido', modified: 'Modificado', removed: 'Eliminado' },
}

const COMMIT_TITLES: Record<Language, Record<ChangeCategory, string>> = {
  en: { auth: 'Develop authentication and access', database: 'Update data structure and persistence', admin: 'Extend the administration interface', api: 'Update API and server logic', ui: 'Improve the user interface', styles: 'Refine styling and responsive behavior', tests: 'Add tests and quality checks', docs: 'Update project documentation', config: 'Update configuration and infrastructure', deps: 'Update project dependencies', assets: 'Update media and static assets', other: 'Refine project logic' },
  ru: { auth: 'Развита система авторизации и доступа', database: 'Обновлена структура и работа с данными', admin: 'Расширена административная панель', api: 'Обновлена API- и серверная логика', ui: 'Улучшен пользовательский интерфейс', styles: 'Доработано оформление и адаптивность', tests: 'Добавлены проверки и тестовые сценарии', docs: 'Актуализирована документация проекта', config: 'Обновлена конфигурация и инфраструктура', deps: 'Обновлены зависимости проекта', assets: 'Обновлены изображения и статические ресурсы', other: 'Доработана логика проекта' },
  zh: { auth: '完善身份验证与访问控制', database: '更新数据结构与持久化', admin: '扩展管理界面', api: '更新 API 与服务端逻辑', ui: '改进用户界面', styles: '优化样式与响应式布局', tests: '添加测试与质量检查', docs: '更新项目文档', config: '更新配置与基础设施', deps: '更新项目依赖', assets: '更新媒体与静态资源', other: '完善项目逻辑' },
  de: { auth: 'Authentifizierung und Zugriff erweitern', database: 'Datenstruktur und Persistenz aktualisieren', admin: 'Administrationsoberfläche erweitern', api: 'API- und Serverlogik aktualisieren', ui: 'Benutzeroberfläche verbessern', styles: 'Stile und Responsivität verfeinern', tests: 'Tests und Qualitätsprüfungen ergänzen', docs: 'Projektdokumentation aktualisieren', config: 'Konfiguration und Infrastruktur aktualisieren', deps: 'Projektabhängigkeiten aktualisieren', assets: 'Medien und statische Ressourcen aktualisieren', other: 'Projektlogik verfeinern' },
  es: { auth: 'Desarrollar autenticación y acceso', database: 'Actualizar estructura y persistencia de datos', admin: 'Ampliar la interfaz de administración', api: 'Actualizar la API y la lógica del servidor', ui: 'Mejorar la interfaz de usuario', styles: 'Refinar estilos y adaptación responsive', tests: 'Añadir pruebas y controles de calidad', docs: 'Actualizar la documentación', config: 'Actualizar configuración e infraestructura', deps: 'Actualizar dependencias', assets: 'Actualizar recursos multimedia y estáticos', other: 'Refinar la lógica del proyecto' },
}

export function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), template)
}

export function categoryLabel(language: Language, category: ChangeCategory): string {
  return CATEGORY_LABELS[language][category]
}

export function statusLabel(language: Language, status: ChangeStatus): string {
  return STATUS_LABELS[language][status]
}

export function commitTitle(language: Language, category: ChangeCategory): string {
  return COMMIT_TITLES[language][category]
}

export function formatLocalizedDate(value: string, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

export function formatLocalizedDateTime(value: string, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function summarizeCommit(commit: InferredCommit, language: Language): string {
  const c = COPY[language]
  const added = commit.changes.filter((change) => change.status === 'added').length
  const modified = commit.changes.filter((change) => change.status === 'modified').length
  const removed = commit.changes.filter((change) => change.status === 'removed').length
  const actions: string[] = []
  if (added) actions.push(`${c.addedFiles}: ${added}`)
  if (modified) actions.push(`${c.modifiedFiles}: ${modified}`)
  if (removed) actions.push(`${c.removedFiles}: ${removed}`)
  const paths = [...commit.changes]
    .sort((left, right) => (right.addedLines + right.removedLines + right.sizeAfter) - (left.addedLines + left.removedLines + left.sizeAfter))
    .slice(0, 3)
    .map((change) => change.path)
  return `${categoryLabel(language, commit.category)}: ${actions.join(', ') || c.relatedFilesUpdated}. ${c.keyFiles}: ${paths.join(', ')}.`
}

export function commitDescription(language: Language, commit: InferredCommit): string {
  return summarizeCommit(commit, language)
}

export function buildLocalizedChangelog(report: AnalysisReport, language: Language): string {
  const c = COPY[language]
  const lines: string[] = [`# ${c.reconstructedChangelog}`, '', `> ${c.changelogDisclaimer}`, '']

  for (const transition of [...report.transitions].reverse()) {
    lines.push(`## ${transition.to.label} — ${formatLocalizedDate(transition.to.capturedAt, language)}`, '')
    if (!transition.changes.length) {
      lines.push(`- ${c.noFileChanges}`, '')
      continue
    }
    for (const commit of transition.commits) {
      lines.push(`### ${commitTitle(language, commit.category)}`, '')
      lines.push(`- ${c.confidenceLabel}: ${commit.confidence}%`)
      lines.push(`- ${summarizeCommit(commit, language)}`)
      for (const change of commit.changes.slice(0, 12)) {
        const marker = change.status === 'added' ? 'A' : change.status === 'removed' ? 'D' : 'M'
        lines.push(`  - \`${marker}\` \`${change.path}\``)
      }
      if (commit.changes.length > 12) lines.push(`  - …${fill(c.moreFiles, { count: commit.changes.length - 12 })}`)
      lines.push('')
    }
  }
  return lines.join('\n')
}

export function buildLocalizedMarkdownReport(report: AnalysisReport, language: Language, formatBytes: (value: number) => string): string {
  const c = COPY[language]
  const lines: string[] = [
    `# ${c.analysisTitle}`, '', `${c.generated}: ${formatLocalizedDateTime(report.generatedAt, language)}`, '',
    `## ${c.summary}`, '',
    `- ${c.snapshots}: ${report.snapshots.length}`,
    `- ${c.inferredCommits}: ${report.totals.inferredCommits}`,
    `- ${c.filesAdded}: ${report.totals.filesAdded}`,
    `- ${c.filesModified}: ${report.totals.filesModified}`,
    `- ${c.filesRemoved}: ${report.totals.filesRemoved}`,
    `- ${c.linesAdded}: ${report.totals.linesAdded}`,
    `- ${c.linesRemoved}: ${report.totals.linesRemoved}`,
    '', `## ${c.snapshotInventory}`, '',
  ]
  for (const snapshot of report.snapshots) {
    lines.push(`- **${snapshot.label}** — ${Object.keys(snapshot.files).length} ${c.filesWord}, ${formatBytes(snapshot.totalBytes)}, ${c.source}: \`${snapshot.sourceName}\``)
  }
  lines.push('', buildLocalizedChangelog(report, language))
  return lines.join('\n')
}

export function lineDeltaLabel(change: FileChange, language: Language, formatBytes: (value: number) => string): string {
  if (change.binary) return `${formatBytes(change.sizeBefore)} → ${formatBytes(change.sizeAfter)}`
  const parts: string[] = []
  if (change.addedLines) parts.push(`+${change.addedLines}`)
  if (change.removedLines) parts.push(`−${change.removedLines}`)
  return parts.join(' / ') || COPY[language].noLineChange
}
