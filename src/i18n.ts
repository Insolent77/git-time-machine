import type { AnalysisReport, ChangeCategory, ChangeStatus, ComparisonMode, FeatureTag, HistoryConfidence, InferredCommit, ScopeAnalysis, SemanticFact, SemanticFactCode, SemanticOperation, Snapshot, VersionTransition } from './lib/types'
import type { ArchiveAnalysisError, ArchiveErrorCode } from './lib/archive-errors'

export type Language = 'en' | 'ru' | 'zh' | 'de' | 'es'
export type CommitStatusMode = 'reconstructed' | 'implemented' | 'verified'

export const LANGUAGE_OPTIONS: Array<{ code: Language; short: string; name: string }> = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ru', short: 'RU', name: 'Русский' },
  { code: 'zh', short: '中文', name: '中文' },
  { code: 'de', short: 'DE', name: 'Deutsch' },
  { code: 'es', short: 'ES', name: 'Español' },
]

export const LOCALES: Record<Language, string> = {
  en: 'en-US', ru: 'ru-RU', zh: 'zh-CN', de: 'de-DE', es: 'es-ES',
}

type Copy = {
  tagline: string
  heroTitle: string
  heroText: string
  localOnly: string
  upload: string
  demo: string
  supported: string
  versions: string
  noArchives: string
  selectFiles: string
  dropHint: string
  addAnother: string
  clear: string
  analyze: string
  analyzing: string
  needTwo: string
  versionLabel: string
  captureDate: string
  moveUp: string
  moveDown: string
  remove: string
  commitSettings: string
  projectDomain: string
  sourceNote: string
  status: string
  statusReconstructed: string
  statusImplemented: string
  statusVerified: string
  optional: string
  results: string
  commits: string
  files: string
  export: string
  search: string
  all: string
  added: string
  modified: string
  removed: string
  noChanges: string
  confidence: string
  copy: string
  copied: string
  downloadAll: string
  downloadJson: string
  errorTitle: string
  archive: string
  reason: string
  howToFix: string
  technical: string
  unsupportedSelected: string
  skippedFiles: string
  errorMinimum: string
  errorCopy: string
  progressOpening: string
  progressExtracting: string
  progressHashing: string
  buildLabel: string
  privacy: string
  sourceCode: string
  detailedCommit: string
  affectedFiles: string
  verification: string
  changedAdded: string
  type: string
  dateTime: string
  source: string
  version: string
  domain: string
  filterNothing: string
}

export const COPY: Record<Language, Copy> = {
  en: {
    tagline: 'ARCHIVE → HISTORY', heroTitle: 'Git Time Machine', heroText: 'Compare dated project archives and reconstruct a reviewable development timeline.', localOnly: 'Processed locally. Source code never leaves the browser.', upload: 'Upload archives', demo: 'Open demo', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Versions', noArchives: 'No archives selected', selectFiles: 'Choose files', dropHint: 'Drop two or more project archives here', addAnother: 'Add archives', clear: 'Clear', analyze: 'Reconstruct history', analyzing: 'Analyzing', needTwo: 'Add at least two versions.', versionLabel: 'Version', captureDate: 'Date', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', commitSettings: 'Commit metadata', projectDomain: 'Project domain', sourceNote: 'Source note', status: 'Status', statusReconstructed: 'Reconstructed — review required', statusImplemented: 'Implemented locally', statusVerified: 'Implemented and checked locally', optional: 'optional', results: 'Reconstructed history', commits: 'Commits', files: 'Files', export: 'Export', search: 'Search file path', all: 'All', added: 'Added', modified: 'Modified', removed: 'Removed', noChanges: 'No changes found between these versions.', confidence: 'confidence', copy: 'Copy', copied: 'Copied', downloadAll: 'Download report', downloadJson: 'JSON', errorTitle: 'Analysis stopped', archive: 'Archive', reason: 'Reason', howToFix: 'How to fix', technical: 'Technical detail', unsupportedSelected: 'Unsupported files were not added.', skippedFiles: 'Skipped', errorMinimum: 'At least two supported archives are required.', errorCopy: 'Clipboard access was blocked.', progressOpening: 'Opening archive engine', progressExtracting: 'Extracting', progressHashing: 'Hashing and reading files', buildLabel: 'BUILD 0.6', privacy: 'All analysis runs in this browser.', sourceCode: 'GitHub', detailedCommit: 'Detailed commit', affectedFiles: 'AFFECTED FILES', verification: 'VERIFICATION', changedAdded: 'CHANGED / ADDED', type: 'Type', dateTime: 'Date and time', source: 'Source', version: 'Version', domain: 'Domain', filterNothing: 'Nothing matches the filter.',
  },
  ru: {
    tagline: 'АРХИВ → ИСТОРИЯ', heroTitle: 'Git Time Machine', heroText: 'Сравнивает архивы проекта по датам и восстанавливает проверяемую историю разработки.', localOnly: 'Обработка локальная. Исходный код не покидает браузер.', upload: 'Загрузить архивы', demo: 'Открыть демо', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Версии', noArchives: 'Архивы не выбраны', selectFiles: 'Выбрать файлы', dropHint: 'Перетащите сюда минимум два архива проекта', addAnother: 'Добавить архивы', clear: 'Очистить', analyze: 'Восстановить историю', analyzing: 'Анализируем', needTwo: 'Добавьте минимум две версии.', versionLabel: 'Версия', captureDate: 'Дата', moveUp: 'Поднять', moveDown: 'Опустить', remove: 'Удалить', commitSettings: 'Метаданные коммитов', projectDomain: 'Домен проекта', sourceNote: 'Источник / примечание', status: 'Статус', statusReconstructed: 'Реконструировано — нужна проверка', statusImplemented: 'Реализовано локально', statusVerified: 'Реализовано и проверено локально', optional: 'необязательно', results: 'Восстановленная история', commits: 'Коммиты', files: 'Файлы', export: 'Экспорт', search: 'Поиск по пути файла', all: 'Все', added: 'Добавлен', modified: 'Изменён', removed: 'Удалён', noChanges: 'Между версиями изменений не найдено.', confidence: 'уверенность', copy: 'Копировать', copied: 'Скопировано', downloadAll: 'Скачать отчёт', downloadJson: 'JSON', errorTitle: 'Анализ остановлен', archive: 'Архив', reason: 'Причина', howToFix: 'Что сделать', technical: 'Техническая деталь', unsupportedSelected: 'Файлы неподдерживаемых форматов не добавлены.', skippedFiles: 'Пропущены', errorMinimum: 'Нужно минимум два поддерживаемых архива.', errorCopy: 'Браузер запретил доступ к буферу обмена.', progressOpening: 'Запуск архивного движка', progressExtracting: 'Распаковка', progressHashing: 'Хеширование и чтение файлов', buildLabel: 'СБОРКА 0.6', privacy: 'Весь анализ выполняется в этом браузере.', sourceCode: 'GitHub', detailedCommit: 'Подробный коммит', affectedFiles: 'ЗАТРОНУТЫЕ ФАЙЛЫ', verification: 'ПРОВЕРКА', changedAdded: 'ИЗМЕНЕНО / ДОБАВЛЕНО', type: 'Тип', dateTime: 'Дата и время', source: 'Источник', version: 'Версия', domain: 'Домен', filterNothing: 'По выбранному фильтру ничего не найдено.',
  },
  zh: {
    tagline: '归档 → 历史', heroTitle: 'Git Time Machine', heroText: '比较不同日期的项目归档，并重建可审阅的开发时间线。', localOnly: '完全在本地处理，源代码不会离开浏览器。', upload: '上传归档', demo: '打开演示', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: '版本', noArchives: '尚未选择归档', selectFiles: '选择文件', dropHint: '拖入至少两个项目归档', addAnother: '添加归档', clear: '清空', analyze: '重建历史', analyzing: '分析中', needTwo: '请至少添加两个版本。', versionLabel: '版本', captureDate: '日期', moveUp: '上移', moveDown: '下移', remove: '删除', commitSettings: '提交元数据', projectDomain: '项目域名', sourceNote: '来源说明', status: '状态', statusReconstructed: '已重建 — 需要审阅', statusImplemented: '已在本地实现', statusVerified: '已在本地实现并检查', optional: '可选', results: '重建历史', commits: '提交', files: '文件', export: '导出', search: '搜索文件路径', all: '全部', added: '新增', modified: '修改', removed: '删除', noChanges: '这些版本之间未发现变化。', confidence: '置信度', copy: '复制', copied: '已复制', downloadAll: '下载报告', downloadJson: 'JSON', errorTitle: '分析已停止', archive: '归档', reason: '原因', howToFix: '解决方法', technical: '技术细节', unsupportedSelected: '不支持格式的文件未添加。', skippedFiles: '已跳过', errorMinimum: '至少需要两个受支持的归档。', errorCopy: '浏览器阻止了剪贴板访问。', progressOpening: '启动归档引擎', progressExtracting: '解压中', progressHashing: '哈希并读取文件', buildLabel: '版本 0.6', privacy: '所有分析都在当前浏览器中运行。', sourceCode: 'GitHub', detailedCommit: '详细提交', affectedFiles: '受影响文件', verification: '验证', changedAdded: '更改 / 新增', type: '类型', dateTime: '日期和时间', source: '来源', version: '版本', domain: '域名', filterNothing: '没有匹配筛选条件的内容。',
  },
  de: {
    tagline: 'ARCHIV → VERLAUF', heroTitle: 'Git Time Machine', heroText: 'Vergleicht datierte Projektarchive und rekonstruiert einen prüfbaren Entwicklungsverlauf.', localOnly: 'Lokale Verarbeitung. Quellcode verlässt den Browser nicht.', upload: 'Archive laden', demo: 'Demo öffnen', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Versionen', noArchives: 'Keine Archive ausgewählt', selectFiles: 'Dateien wählen', dropHint: 'Mindestens zwei Projektarchive hier ablegen', addAnother: 'Archive hinzufügen', clear: 'Leeren', analyze: 'Verlauf rekonstruieren', analyzing: 'Analyse läuft', needTwo: 'Mindestens zwei Versionen hinzufügen.', versionLabel: 'Version', captureDate: 'Datum', moveUp: 'Nach oben', moveDown: 'Nach unten', remove: 'Entfernen', commitSettings: 'Commit-Metadaten', projectDomain: 'Projektdomain', sourceNote: 'Quellenhinweis', status: 'Status', statusReconstructed: 'Rekonstruiert — Prüfung nötig', statusImplemented: 'Lokal umgesetzt', statusVerified: 'Lokal umgesetzt und geprüft', optional: 'optional', results: 'Rekonstruierter Verlauf', commits: 'Commits', files: 'Dateien', export: 'Export', search: 'Dateipfad suchen', all: 'Alle', added: 'Hinzugefügt', modified: 'Geändert', removed: 'Entfernt', noChanges: 'Zwischen diesen Versionen wurden keine Änderungen gefunden.', confidence: 'Konfidenz', copy: 'Kopieren', copied: 'Kopiert', downloadAll: 'Bericht laden', downloadJson: 'JSON', errorTitle: 'Analyse angehalten', archive: 'Archiv', reason: 'Grund', howToFix: 'Lösung', technical: 'Technisches Detail', unsupportedSelected: 'Nicht unterstützte Dateien wurden nicht hinzugefügt.', skippedFiles: 'Übersprungen', errorMinimum: 'Mindestens zwei unterstützte Archive sind erforderlich.', errorCopy: 'Der Browser hat den Zugriff auf die Zwischenablage blockiert.', progressOpening: 'Archiv-Engine starten', progressExtracting: 'Entpacken', progressHashing: 'Dateien hashen und lesen', buildLabel: 'BUILD 0.6', privacy: 'Die gesamte Analyse läuft in diesem Browser.', sourceCode: 'GitHub', detailedCommit: 'Detaillierter Commit', affectedFiles: 'BETROFFENE DATEIEN', verification: 'PRÜFUNG', changedAdded: 'GEÄNDERT / HINZUGEFÜGT', type: 'Typ', dateTime: 'Datum und Uhrzeit', source: 'Quelle', version: 'Version', domain: 'Domain', filterNothing: 'Kein Treffer für den Filter.',
  },
  es: {
    tagline: 'ARCHIVO → HISTORIA', heroTitle: 'Git Time Machine', heroText: 'Compara archivos fechados del proyecto y reconstruye un historial de desarrollo revisable.', localOnly: 'Procesamiento local. El código fuente no sale del navegador.', upload: 'Subir archivos', demo: 'Abrir demo', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Versiones', noArchives: 'No hay archivos seleccionados', selectFiles: 'Elegir archivos', dropHint: 'Suelta aquí al menos dos archivos del proyecto', addAnother: 'Añadir archivos', clear: 'Limpiar', analyze: 'Reconstruir historial', analyzing: 'Analizando', needTwo: 'Añade al menos dos versiones.', versionLabel: 'Versión', captureDate: 'Fecha', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Eliminar', commitSettings: 'Metadatos del commit', projectDomain: 'Dominio del proyecto', sourceNote: 'Nota de origen', status: 'Estado', statusReconstructed: 'Reconstruido — requiere revisión', statusImplemented: 'Implementado localmente', statusVerified: 'Implementado y comprobado localmente', optional: 'opcional', results: 'Historial reconstruido', commits: 'Commits', files: 'Archivos', export: 'Exportar', search: 'Buscar ruta de archivo', all: 'Todos', added: 'Añadido', modified: 'Modificado', removed: 'Eliminado', noChanges: 'No se encontraron cambios entre estas versiones.', confidence: 'confianza', copy: 'Copiar', copied: 'Copiado', downloadAll: 'Descargar informe', downloadJson: 'JSON', errorTitle: 'Análisis detenido', archive: 'Archivo', reason: 'Motivo', howToFix: 'Cómo resolverlo', technical: 'Detalle técnico', unsupportedSelected: 'Los archivos con formatos no compatibles no se añadieron.', skippedFiles: 'Omitidos', errorMinimum: 'Se necesitan al menos dos archivos compatibles.', errorCopy: 'El navegador bloqueó el portapapeles.', progressOpening: 'Iniciando motor de archivos', progressExtracting: 'Extrayendo', progressHashing: 'Calculando hashes y leyendo archivos', buildLabel: 'BUILD 0.6', privacy: 'Todo el análisis se ejecuta en este navegador.', sourceCode: 'GitHub', detailedCommit: 'Commit detallado', affectedFiles: 'ARCHIVOS AFECTADOS', verification: 'VERIFICACIÓN', changedAdded: 'CAMBIADO / AÑADIDO', type: 'Tipo', dateTime: 'Fecha y hora', source: 'Origen', version: 'Versión', domain: 'Dominio', filterNothing: 'Nada coincide con el filtro.',
  },
}

const CATEGORY_LABELS: Record<Language, Record<ChangeCategory, string>> = {
  en: { auth: 'Authentication / access', database: 'Database / persistence', admin: 'Admin interface', api: 'API / server logic', ui: 'User interface', styles: 'Styles / responsive layout', tests: 'Tests / quality checks', docs: 'Documentation', config: 'Configuration / infrastructure', deps: 'Dependencies', assets: 'Assets', other: 'Project logic' },
  ru: { auth: 'Авторизация / доступ', database: 'База данных / хранение', admin: 'Административная панель', api: 'API / серверная логика', ui: 'Пользовательский интерфейс', styles: 'Стили / адаптивность', tests: 'Тесты / контроль качества', docs: 'Документация', config: 'Конфигурация / инфраструктура', deps: 'Зависимости', assets: 'Ресурсы', other: 'Логика проекта' },
  zh: { auth: '身份验证 / 访问', database: '数据库 / 持久化', admin: '管理界面', api: 'API / 服务端逻辑', ui: '用户界面', styles: '样式 / 响应式', tests: '测试 / 质量检查', docs: '文档', config: '配置 / 基础设施', deps: '依赖', assets: '资源', other: '项目逻辑' },
  de: { auth: 'Authentifizierung / Zugriff', database: 'Datenbank / Persistenz', admin: 'Administrationsoberfläche', api: 'API / Serverlogik', ui: 'Benutzeroberfläche', styles: 'Stile / Responsivität', tests: 'Tests / Qualitätskontrolle', docs: 'Dokumentation', config: 'Konfiguration / Infrastruktur', deps: 'Abhängigkeiten', assets: 'Ressourcen', other: 'Projektlogik' },
  es: { auth: 'Autenticación / acceso', database: 'Base de datos / persistencia', admin: 'Interfaz de administración', api: 'API / lógica del servidor', ui: 'Interfaz de usuario', styles: 'Estilos / adaptación', tests: 'Pruebas / calidad', docs: 'Documentación', config: 'Configuración / infraestructura', deps: 'Dependencias', assets: 'Recursos', other: 'Lógica del proyecto' },
}

const STATUS_LABELS: Record<Language, Record<ChangeStatus, string>> = {
  en: { added: 'Added', modified: 'Modified', removed: 'Removed' },
  ru: { added: 'Добавлен', modified: 'Изменён', removed: 'Удалён' },
  zh: { added: '新增', modified: '修改', removed: '删除' },
  de: { added: 'Hinzugefügt', modified: 'Geändert', removed: 'Entfernt' },
  es: { added: 'Añadido', modified: 'Modificado', removed: 'Eliminado' },
}

const ERROR_HINTS: Record<Language, Record<ArchiveErrorCode, string>> = {
  en: {
    UNSUPPORTED_FORMAT: 'Choose ZIP, RAR, 7Z, TAR, GZ, BZ2, or XZ.', ARCHIVE_TOO_LARGE: 'Remove dependencies/build output and create an archive under 300 MB.', CORRUPT_ARCHIVE: 'Open the archive locally to confirm it is complete, then recreate it with a standard compressor.', ENCRYPTED_ARCHIVE: 'Create an unencrypted copy. Password entry is not available yet.', EMPTY_ARCHIVE: 'Choose an archive that contains the project files.', TOO_MANY_FILES: 'Remove node_modules, vendor, dist, build, caches, and retry.', NO_ANALYZABLE_FILES: 'Check that source files are present and are not all excluded or larger than the per-file limit.', ENTRY_READ_FAILED: 'Recreate the archive; one internal file could not be extracted.', WASM_ASSETS_MISSING: 'Run npm install and npm run build again. Confirm public/libarchive contains worker-bundle.js and libarchive.wasm.', BROWSER_UNSUPPORTED: 'Use a current Chromium, Firefox, or Safari browser with WebAssembly and Web Workers enabled.', OUT_OF_MEMORY: 'Close other tabs or use a smaller archive without dependencies and build output.', UNKNOWN: 'Open the technical detail, then retry with a newly created archive.',
  },
  ru: {
    UNSUPPORTED_FORMAT: 'Выберите ZIP, RAR, 7Z, TAR, GZ, BZ2 или XZ.', ARCHIVE_TOO_LARGE: 'Удалите зависимости и результаты сборки, затем создайте архив меньше 300 МБ.', CORRUPT_ARCHIVE: 'Откройте архив на компьютере, убедитесь, что он целый, и пересоздайте стандартным архиватором.', ENCRYPTED_ARCHIVE: 'Создайте копию без пароля. Ввод пароля пока не реализован.', EMPTY_ARCHIVE: 'Выберите архив, в котором действительно находятся файлы проекта.', TOO_MANY_FILES: 'Удалите node_modules, vendor, dist, build и кеши, затем повторите.', NO_ANALYZABLE_FILES: 'Проверьте наличие исходников: возможно, внутри только исключённые каталоги или слишком крупные файлы.', ENTRY_READ_FAILED: 'Пересоздайте архив: один из внутренних файлов не удалось распаковать.', WASM_ASSETS_MISSING: 'Повторите npm install и npm run build. Проверьте наличие worker-bundle.js и libarchive.wasm в public/libarchive.', BROWSER_UNSUPPORTED: 'Используйте актуальный Chrome, Edge, Firefox или Safari с включёнными WebAssembly и Web Workers.', OUT_OF_MEMORY: 'Закройте лишние вкладки или уменьшите архив, исключив зависимости и сборочные файлы.', UNKNOWN: 'Посмотрите техническую деталь и повторите с заново созданным архивом.',
  },
  zh: {
    UNSUPPORTED_FORMAT: '请选择 ZIP、RAR、7Z、TAR、GZ、BZ2 或 XZ。', ARCHIVE_TOO_LARGE: '删除依赖和构建产物，将归档缩小到 300 MB 以下。', CORRUPT_ARCHIVE: '先在本地确认归档完整，再用标准工具重新创建。', ENCRYPTED_ARCHIVE: '请创建无密码副本，当前版本尚不支持输入密码。', EMPTY_ARCHIVE: '请选择包含项目文件的归档。', TOO_MANY_FILES: '删除 node_modules、vendor、dist、build 和缓存后重试。', NO_ANALYZABLE_FILES: '确认归档中包含源文件，且未全部被排除或超过大小限制。', ENTRY_READ_FAILED: '重新创建归档，其中一个内部文件无法解压。', WASM_ASSETS_MISSING: '重新运行 npm install 和 npm run build，并检查 public/libarchive 中的资源。', BROWSER_UNSUPPORTED: '请使用支持 WebAssembly 和 Web Workers 的现代浏览器。', OUT_OF_MEMORY: '关闭其他标签页，或创建不含依赖与构建产物的小型归档。', UNKNOWN: '查看技术细节，并使用重新创建的归档重试。',
  },
  de: {
    UNSUPPORTED_FORMAT: 'ZIP, RAR, 7Z, TAR, GZ, BZ2 oder XZ auswählen.', ARCHIVE_TOO_LARGE: 'Abhängigkeiten und Build-Ausgaben entfernen; Archiv unter 300 MB erstellen.', CORRUPT_ARCHIVE: 'Archiv lokal prüfen und mit einem Standardprogramm neu erstellen.', ENCRYPTED_ARCHIVE: 'Eine unverschlüsselte Kopie erstellen; Passworteingabe ist noch nicht verfügbar.', EMPTY_ARCHIVE: 'Ein Archiv mit Projektdateien auswählen.', TOO_MANY_FILES: 'node_modules, vendor, dist, build und Caches entfernen.', NO_ANALYZABLE_FILES: 'Prüfen, ob Quelldateien vorhanden und nicht vollständig ausgeschlossen sind.', ENTRY_READ_FAILED: 'Archiv neu erstellen; eine interne Datei konnte nicht extrahiert werden.', WASM_ASSETS_MISSING: 'npm install und npm run build erneut ausführen; public/libarchive prüfen.', BROWSER_UNSUPPORTED: 'Einen aktuellen Browser mit WebAssembly und Web Workers verwenden.', OUT_OF_MEMORY: 'Andere Tabs schließen oder ein kleineres Archiv ohne Abhängigkeiten verwenden.', UNKNOWN: 'Technisches Detail prüfen und mit einem neu erstellten Archiv erneut versuchen.',
  },
  es: {
    UNSUPPORTED_FORMAT: 'Elige ZIP, RAR, 7Z, TAR, GZ, BZ2 o XZ.', ARCHIVE_TOO_LARGE: 'Elimina dependencias y resultados de compilación; crea un archivo menor de 300 MB.', CORRUPT_ARCHIVE: 'Comprueba el archivo localmente y vuelve a crearlo con un compresor estándar.', ENCRYPTED_ARCHIVE: 'Crea una copia sin contraseña; la entrada de contraseña aún no está disponible.', EMPTY_ARCHIVE: 'Selecciona un archivo que contenga los archivos del proyecto.', TOO_MANY_FILES: 'Elimina node_modules, vendor, dist, build y cachés.', NO_ANALYZABLE_FILES: 'Comprueba que hay código fuente y que no todo está excluido o supera el límite.', ENTRY_READ_FAILED: 'Vuelve a crear el archivo; no se pudo extraer un fichero interno.', WASM_ASSETS_MISSING: 'Ejecuta de nuevo npm install y npm run build; revisa public/libarchive.', BROWSER_UNSUPPORTED: 'Usa un navegador moderno con WebAssembly y Web Workers.', OUT_OF_MEMORY: 'Cierra otras pestañas o usa un archivo más pequeño sin dependencias.', UNKNOWN: 'Revisa el detalle técnico y prueba con un archivo creado de nuevo.',
  },
}

export function categoryLabel(language: Language, category: ChangeCategory): string {
  return CATEGORY_LABELS[language][category]
}

export function statusLabel(language: Language, status: ChangeStatus): string {
  return STATUS_LABELS[language][status]
}

export function commitStatusLabel(language: Language, status: CommitStatusMode): string {
  const c = COPY[language]
  return status === 'verified' ? c.statusVerified : status === 'implemented' ? c.statusImplemented : c.statusReconstructed
}

export function archiveErrorHint(language: Language, error: ArchiveAnalysisError): string {
  return ERROR_HINTS[language][error.code]
}

export function formatLocalizedDate(value: string, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}

function utcOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  const absolute = Math.abs(minutes)
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`
}

function preciseDate(snapshot: Snapshot, language: Language): string {
  const date = new Date(snapshot.capturedAt)
  const parts = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')]
  if (snapshot.capturePrecision === 'date') {
    const suffix: Record<Language, string> = {
      en: 'exact time is not confirmed',
      ru: 'точное время не подтверждено',
      zh: '具体时间未经确认',
      de: 'genaue Uhrzeit nicht bestätigt',
      es: 'hora exacta no confirmada',
    }
    return `${parts.join('-')} (${suffix[language]})`
  }
  const time = [String(date.getHours()).padStart(2, '0'), String(date.getMinutes()).padStart(2, '0'), String(date.getSeconds()).padStart(2, '0')]
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'
  return `${parts.join('-')} ${time.join(':')} (${zone}, ${utcOffset(date)})`
}

const MODE_LABELS: Record<Language, Record<ComparisonMode | 'full_resolved' | 'patch_resolved', string>> = {
  en: { auto: 'Detect automatically', full: 'Full snapshots', patch: 'Module / patch', full_resolved: 'Full snapshot', patch_resolved: 'Module / patch' },
  ru: { auto: 'Определить автоматически', full: 'Полные снимки', patch: 'Отдельный модуль / патч', full_resolved: 'Полный снимок', patch_resolved: 'Отдельный модуль / патч' },
  zh: { auto: '自动检测', full: '完整快照', patch: '模块 / 补丁', full_resolved: '完整快照', patch_resolved: '模块 / 补丁' },
  de: { auto: 'Automatisch erkennen', full: 'Vollständige Snapshots', patch: 'Modul / Patch', full_resolved: 'Vollständiger Snapshot', patch_resolved: 'Modul / Patch' },
  es: { auto: 'Detectar automáticamente', full: 'Instantáneas completas', patch: 'Módulo / parche', full_resolved: 'Instantánea completa', patch_resolved: 'Módulo / parche' },
}

export function comparisonModeLabel(language: Language, mode: ComparisonMode): string {
  return MODE_LABELS[language][mode]
}

export function resolvedModeLabel(language: Language, scope: ScopeAnalysis): string {
  return MODE_LABELS[language][scope.resolvedMode === 'full' ? 'full_resolved' : 'patch_resolved']
}

const HISTORY_LABELS: Record<Language, Record<HistoryConfidence, string>> = {
  en: { low: 'low', medium: 'medium', high: 'high' },
  ru: { low: 'низкая', medium: 'средняя', high: 'высокая' },
  zh: { low: '低', medium: '中', high: '高' },
  de: { low: 'niedrig', medium: 'mittel', high: 'hoch' },
  es: { low: 'baja', medium: 'media', high: 'alta' },
}

export function historyConfidenceLabel(language: Language, confidence: HistoryConfidence): string {
  return HISTORY_LABELS[language][confidence]
}

export function scopeDiagnostic(language: Language, scope: ScopeAnalysis): { title: string; body: string } | null {
  if (scope.resolvedMode !== 'patch') return null
  if (language === 'ru') {
    return {
      title: 'Архивы имеют разный охват',
      body: `В предыдущем архиве ${scope.fromFileCount} файлов, в текущем ${scope.toFileCount}, совпадающих путей — ${scope.commonPathCount}. Текущий архив обработан как отдельный модуль/патч. ${scope.ignoredPotentialRemovals} отсутствующих путей не считаются удалёнными.`,
    }
  }
  if (language === 'zh') return { title: '归档范围不同', body: `上一归档 ${scope.fromFileCount} 个文件，当前归档 ${scope.toFileCount} 个文件，共同路径 ${scope.commonPathCount} 个。当前归档按模块/补丁处理，${scope.ignoredPotentialRemovals} 个缺失路径不会计为删除。` }
  if (language === 'de') return { title: 'Die Archive haben unterschiedlichen Umfang', body: `Vorher: ${scope.fromFileCount} Dateien, aktuell: ${scope.toFileCount}, gemeinsame Pfade: ${scope.commonPathCount}. Das aktuelle Archiv wird als Modul/Patch behandelt; ${scope.ignoredPotentialRemovals} fehlende Pfade gelten nicht als gelöscht.` }
  if (language === 'es') return { title: 'Los archivos tienen distinto alcance', body: `Anterior: ${scope.fromFileCount} archivos, actual: ${scope.toFileCount}, rutas comunes: ${scope.commonPathCount}. El archivo actual se trata como módulo/parche; ${scope.ignoredPotentialRemovals} rutas ausentes no se consideran eliminadas.` }
  return {
    title: 'Archive scopes do not match',
    body: `Previous archive: ${scope.fromFileCount} files; current archive: ${scope.toFileCount}; matching paths: ${scope.commonPathCount}. The current archive is treated as a module/patch, so ${scope.ignoredPotentialRemovals} absent paths are not counted as deletions.`,
  }
}

const SEMANTIC_NOUNS: Record<Language, Record<SemanticFactCode, string>> = {
  en: {
    function: 'function', class: 'class', interface: 'interface', type_definition: 'type definition', component: 'UI component', route: 'server route', api_request: 'client API request', database_table: 'database table', database_column: 'database column', database_index: 'database index', database_relation: 'database relation', dependency: 'dependency', build_script: 'build or service script', environment_variable: 'environment variable', test_case: 'test case', documentation_section: 'documentation section', form: 'form', input_field: 'form fields', user_cabinet: 'personal account area', contract_section: 'contract section', schedule_section: 'schedule and calendar section', payments_section: 'payments and receipts section', homework_section: 'homework section', profile_settings: 'profile and password settings', shared_navigation: 'shared page layout and navigation', installation_setup: 'installation and environment setup', logout: 'logout flow', authentication: 'authentication flow', one_time_code: 'one-time-code authentication', password_security: 'password hashing and verification', csrf_protection: 'CSRF protection', session_security: 'session protection', authorization: 'role and permission checks', email_delivery: 'email delivery', file_upload: 'file upload', file_download: 'download or export', search: 'search', filtering: 'filtering', sorting: 'sorting', pagination: 'pagination', modal_dialog: 'modal dialog', responsive_layout: 'responsive layout', animation: 'interface animation', layout_system: 'grid or flex layout', localization: 'localization and language switching', browser_storage: 'browser-side state persistence', caching: 'caching', logging: 'application logging', realtime_connection: 'real-time connection', background_worker: 'background processing', drag_and_drop: 'drag-and-drop interaction', validation: 'input validation', error_handling: 'error handling', json_api: 'JSON API response', redirect_navigation: 'redirect or navigation flow', configuration: 'project configuration', ci_pipeline: 'continuous integration pipeline', containerization: 'containerized runtime', access_rule: 'server access rule', code_logic: 'code logic', file_content: 'file content',
  },
  ru: {
    function: 'функция', class: 'класс', interface: 'интерфейс', type_definition: 'описание типа', component: 'компонент интерфейса', route: 'серверный маршрут', api_request: 'клиентский API-запрос', database_table: 'таблица базы данных', database_column: 'поле базы данных', database_index: 'индекс базы данных', database_relation: 'связь таблиц', dependency: 'зависимость', build_script: 'сценарий сборки или запуска', environment_variable: 'переменная окружения', test_case: 'тестовый сценарий', documentation_section: 'раздел документации', form: 'форма', input_field: 'поля формы', user_cabinet: 'личный кабинет', contract_section: 'раздел договора', schedule_section: 'раздел расписания и календаря', payments_section: 'раздел оплат и чеков', homework_section: 'раздел домашних заданий', profile_settings: 'настройки профиля и пароля', shared_navigation: 'общий layout и навигация страниц', installation_setup: 'установка и настройка окружения', logout: 'выход из аккаунта', authentication: 'сценарий авторизации', one_time_code: 'авторизация по одноразовому коду', password_security: 'хеширование и проверка паролей', csrf_protection: 'защита от CSRF', session_security: 'защита пользовательской сессии', authorization: 'проверка ролей и прав доступа', email_delivery: 'отправка email', file_upload: 'загрузка файлов', file_download: 'скачивание или экспорт', search: 'поиск', filtering: 'фильтрация', sorting: 'сортировка', pagination: 'постраничный вывод', modal_dialog: 'модальное окно', responsive_layout: 'адаптивная вёрстка', animation: 'анимация интерфейса', layout_system: 'сетка Grid/Flex', localization: 'локализация и переключение языка', browser_storage: 'сохранение состояния в браузере', caching: 'кеширование', logging: 'журналирование событий', realtime_connection: 'соединение в реальном времени', background_worker: 'фоновая обработка', drag_and_drop: 'перетаскивание элементов', validation: 'валидация данных', error_handling: 'обработка ошибок', json_api: 'JSON-ответ API', redirect_navigation: 'перенаправление или переход', configuration: 'конфигурация проекта', ci_pipeline: 'автоматическая CI/CD-сборка', containerization: 'контейнерное окружение', access_rule: 'серверное правило доступа', code_logic: 'логика кода', file_content: 'содержимое файла',
  },
  zh: {
    function: '函数', class: '类', interface: '接口', type_definition: '类型定义', component: '界面组件', route: '服务端路由', api_request: '客户端 API 请求', database_table: '数据库表', database_column: '数据库字段', database_index: '数据库索引', database_relation: '数据库关系', dependency: '依赖', build_script: '构建或运行脚本', environment_variable: '环境变量', test_case: '测试用例', documentation_section: '文档章节', form: '表单', input_field: '表单字段', user_cabinet: '个人中心', contract_section: '合同模块', schedule_section: '日程和日历模块', payments_section: '支付与收据模块', homework_section: '作业模块', profile_settings: '个人资料和密码设置', shared_navigation: '共享页面布局和导航', installation_setup: '安装和环境配置', logout: '退出登录流程', authentication: '身份验证流程', one_time_code: '一次性验证码登录', password_security: '密码哈希与验证', csrf_protection: 'CSRF 防护', session_security: '会话保护', authorization: '角色和权限检查', email_delivery: '邮件发送', file_upload: '文件上传', file_download: '下载或导出', search: '搜索', filtering: '筛选', sorting: '排序', pagination: '分页', modal_dialog: '模态窗口', responsive_layout: '响应式布局', animation: '界面动画', layout_system: 'Grid/Flex 布局', localization: '本地化与语言切换', browser_storage: '浏览器状态持久化', caching: '缓存', logging: '应用日志', realtime_connection: '实时连接', background_worker: '后台处理', drag_and_drop: '拖放交互', validation: '数据验证', error_handling: '错误处理', json_api: 'JSON API 响应', redirect_navigation: '重定向或导航', configuration: '项目配置', ci_pipeline: 'CI/CD 流水线', containerization: '容器运行环境', access_rule: '服务器访问规则', code_logic: '代码逻辑', file_content: '文件内容',
  },
  de: {
    function: 'Funktion', class: 'Klasse', interface: 'Schnittstelle', type_definition: 'Typdefinition', component: 'UI-Komponente', route: 'Serverroute', api_request: 'Client-API-Anfrage', database_table: 'Datenbanktabelle', database_column: 'Datenbankspalte', database_index: 'Datenbankindex', database_relation: 'Datenbankbeziehung', dependency: 'Abhängigkeit', build_script: 'Build- oder Startskript', environment_variable: 'Umgebungsvariable', test_case: 'Testfall', documentation_section: 'Dokumentationsabschnitt', form: 'Formular', input_field: 'Formularfelder', user_cabinet: 'Benutzerportal', contract_section: 'Vertragsbereich', schedule_section: 'Termin- und Kalenderbereich', payments_section: 'Zahlungs- und Belegbereich', homework_section: 'Hausaufgabenbereich', profile_settings: 'Profil- und Passworteinstellungen', shared_navigation: 'gemeinsames Seitenlayout und Navigation', installation_setup: 'Installation und Umgebungseinrichtung', logout: 'Abmeldeablauf', authentication: 'Authentifizierungsablauf', one_time_code: 'Einmalcode-Anmeldung', password_security: 'Passwort-Hashing und Prüfung', csrf_protection: 'CSRF-Schutz', session_security: 'Sitzungsschutz', authorization: 'Rollen- und Rechteprüfung', email_delivery: 'E-Mail-Versand', file_upload: 'Datei-Upload', file_download: 'Download oder Export', search: 'Suche', filtering: 'Filterung', sorting: 'Sortierung', pagination: 'Seitennavigation', modal_dialog: 'Modalfenster', responsive_layout: 'responsives Layout', animation: 'Oberflächenanimation', layout_system: 'Grid-/Flex-Layout', localization: 'Lokalisierung und Sprachwechsel', browser_storage: 'Browser-Zustandsspeicherung', caching: 'Caching', logging: 'Anwendungsprotokollierung', realtime_connection: 'Echtzeitverbindung', background_worker: 'Hintergrundverarbeitung', drag_and_drop: 'Drag-and-drop', validation: 'Datenvalidierung', error_handling: 'Fehlerbehandlung', json_api: 'JSON-API-Antwort', redirect_navigation: 'Weiterleitung oder Navigation', configuration: 'Projektkonfiguration', ci_pipeline: 'CI/CD-Pipeline', containerization: 'Container-Laufzeit', access_rule: 'Server-Zugriffsregel', code_logic: 'Codelogik', file_content: 'Dateiinhalt',
  },
  es: {
    function: 'función', class: 'clase', interface: 'interfaz', type_definition: 'definición de tipo', component: 'componente de interfaz', route: 'ruta del servidor', api_request: 'petición API del cliente', database_table: 'tabla de base de datos', database_column: 'campo de base de datos', database_index: 'índice de base de datos', database_relation: 'relación de base de datos', dependency: 'dependencia', build_script: 'script de compilación o inicio', environment_variable: 'variable de entorno', test_case: 'caso de prueba', documentation_section: 'sección de documentación', form: 'formulario', input_field: 'campos de formulario', user_cabinet: 'área personal', contract_section: 'sección de contrato', schedule_section: 'sección de horario y calendario', payments_section: 'sección de pagos y recibos', homework_section: 'sección de tareas', profile_settings: 'ajustes de perfil y contraseña', shared_navigation: 'diseño y navegación compartidos', installation_setup: 'instalación y configuración del entorno', logout: 'flujo de cierre de sesión', authentication: 'flujo de autenticación', one_time_code: 'autenticación con código de un solo uso', password_security: 'hash y verificación de contraseñas', csrf_protection: 'protección CSRF', session_security: 'protección de sesión', authorization: 'comprobación de roles y permisos', email_delivery: 'envío de email', file_upload: 'subida de archivos', file_download: 'descarga o exportación', search: 'búsqueda', filtering: 'filtrado', sorting: 'ordenación', pagination: 'paginación', modal_dialog: 'ventana modal', responsive_layout: 'diseño adaptable', animation: 'animación de interfaz', layout_system: 'diseño Grid/Flex', localization: 'localización y cambio de idioma', browser_storage: 'persistencia en el navegador', caching: 'caché', logging: 'registro de la aplicación', realtime_connection: 'conexión en tiempo real', background_worker: 'procesamiento en segundo plano', drag_and_drop: 'interacción de arrastrar y soltar', validation: 'validación de datos', error_handling: 'gestión de errores', json_api: 'respuesta JSON de API', redirect_navigation: 'redirección o navegación', configuration: 'configuración del proyecto', ci_pipeline: 'canalización CI/CD', containerization: 'entorno en contenedor', access_rule: 'regla de acceso del servidor', code_logic: 'lógica del código', file_content: 'contenido del archivo',
  },
}

const SEMANTIC_OPERATIONS: Record<Language, Record<SemanticOperation, string>> = {
  en: { added: 'Added', modified: 'Changed', removed: 'Removed' },
  ru: { added: 'Добавлено', modified: 'Изменено', removed: 'Удалено' },
  zh: { added: '新增', modified: '修改', removed: '删除' },
  de: { added: 'Hinzugefügt', modified: 'Geändert', removed: 'Entfernt' },
  es: { added: 'Añadido', modified: 'Modificado', removed: 'Eliminado' },
}

const SECTION_LABELS: Record<Language, {
  functional: string
  structural: string
  fallback: string
  fileSummary: string
  evidence: string
}> = {
  en: { functional: 'FUNCTIONAL CHANGES', structural: 'STRUCTURAL CODE FACTS', fallback: 'CHANGES REQUIRING REVIEW', fileSummary: 'FILE-LEVEL SUMMARY', evidence: 'evidence' },
  ru: { functional: 'ФУНКЦИОНАЛЬНЫЕ ИЗМЕНЕНИЯ', structural: 'СТРУКТУРНЫЕ ФАКТЫ ПО КОДУ', fallback: 'ИЗМЕНЕНИЯ, ТРЕБУЮЩИЕ ПРОВЕРКИ', fileSummary: 'ФАЙЛОВАЯ СВОДКА', evidence: 'основание' },
  zh: { functional: '功能变更', structural: '代码结构事实', fallback: '需要复核的变更', fileSummary: '文件级摘要', evidence: '依据' },
  de: { functional: 'FUNKTIONALE ÄNDERUNGEN', structural: 'STRUKTURELLE CODE-FAKTEN', fallback: 'ZU PRÜFENDE ÄNDERUNGEN', fileSummary: 'DATEI-ZUSAMMENFASSUNG', evidence: 'Nachweis' },
  es: { functional: 'CAMBIOS FUNCIONALES', structural: 'HECHOS ESTRUCTURALES DEL CÓDIGO', fallback: 'CAMBIOS QUE REQUIEREN REVISIÓN', fileSummary: 'RESUMEN POR ARCHIVOS', evidence: 'evidencia' },
}

function countLinesByStatus(commit: InferredCommit, status: 'added' | 'modified' | 'removed'): { added: number; removed: number } {
  return commit.changes.filter((change) => change.status === status && !change.binary).reduce((sum, change) => ({ added: sum.added + change.addedLines, removed: sum.removed + change.removedLines }), { added: 0, removed: 0 })
}

function fileSummaryBullets(language: Language, transition: VersionTransition, commit: InferredCommit): string[] {
  const counts = {
    added: commit.changes.filter((change) => change.status === 'added').length,
    modified: commit.changes.filter((change) => change.status === 'modified').length,
    removed: commit.changes.filter((change) => change.status === 'removed').length,
  }
  const addedText = countLinesByStatus(commit, 'added')
  const modifiedText = countLinesByStatus(commit, 'modified')
  const removedText = countLinesByStatus(commit, 'removed')

  if (language === 'ru') {
    const result: string[] = []
    if (counts.added) result.push(`Добавлено файлов: ${counts.added}.`)
    if (counts.modified) result.push(`Изменено файлов с совпадающими путями: ${counts.modified}; различие подтверждено SHA-256.`)
    if (counts.removed) result.push(`Подтверждённо удалено файлов: ${counts.removed}; сравнение выполнялось как полный снимок.`)
    if (addedText.added) result.push(`В новых текстовых файлах обнаружено ${addedText.added} строк; это объём новых файлов, а не diff существующего кода.`)
    if (modifiedText.added || modifiedText.removed) result.push(`Приблизительный построчный diff совпадающих файлов: +${modifiedText.added} / −${modifiedText.removed}.`)
    if (removedText.removed) result.push(`Удалённые текстовые файлы содержали ${removedText.removed} строк.`)
    if (!transition.scope.removalsReliable) result.push(`${transition.scope.ignoredPotentialRemovals} путей предыдущего архива не считаются удалёнными, потому что текущий архив определён как модуль/патч.`)
    return result
  }

  const result: string[] = []
  if (counts.added) result.push(`${counts.added} files were added.`)
  if (counts.modified) result.push(`${counts.modified} matching-path files changed; different SHA-256 values confirm the change.`)
  if (counts.removed) result.push(`${counts.removed} files were confirmed removed in full-snapshot mode.`)
  if (addedText.added) result.push(`New text files contain ${addedText.added} lines; this is new-file volume rather than a diff against existing code.`)
  if (modifiedText.added || modifiedText.removed) result.push(`Approximate line diff for matching files: +${modifiedText.added} / −${modifiedText.removed}.`)
  if (!transition.scope.removalsReliable) result.push(`${transition.scope.ignoredPotentialRemovals} absent previous paths are not treated as deletions because the current archive is a module/patch.`)
  return result
}

function detailsSuffix(fact: SemanticFact): string {
  if (!fact.details?.length) return ''
  return ` — ${fact.details.join(', ')}`
}

function evidenceSuffix(language: Language, fact: SemanticFact): string {
  const paths = [...new Set(fact.evidence.map((item) => `${item.path}${item.line ? `:${item.line}` : ''}`))]
  if (!paths.length) return ''
  const selected = paths.slice(0, 3).join(', ')
  const rest = paths.length > 3 ? ` +${paths.length - 3}` : ''
  return ` [${SECTION_LABELS[language].evidence}: ${selected}${rest}; ${fact.confidence}%]`
}

const SEMANTIC_GENERIC_SUBJECT_CODES = new Set<SemanticFactCode>([
  'input_field', 'user_cabinet', 'contract_section', 'schedule_section', 'payments_section', 'homework_section',
  'profile_settings', 'shared_navigation', 'installation_setup', 'logout', 'authentication', 'one_time_code',
  'password_security', 'csrf_protection', 'session_security', 'authorization', 'email_delivery',
  'file_upload', 'file_download', 'search', 'filtering', 'sorting', 'pagination', 'modal_dialog',
  'responsive_layout', 'animation', 'layout_system', 'localization', 'browser_storage', 'caching',
  'logging', 'realtime_connection', 'background_worker', 'drag_and_drop', 'validation',
  'error_handling', 'json_api', 'redirect_navigation', 'configuration', 'ci_pipeline',
  'containerization', 'access_rule',
])

function renderSemanticFact(language: Language, fact: SemanticFact): string {
  const operation = SEMANTIC_OPERATIONS[language][fact.operation]
  const noun = SEMANTIC_NOUNS[language][fact.code]
  const details = detailsSuffix(fact)
  const evidence = evidenceSuffix(language, fact)
  const inference = fact.certainty === 'inference'
    ? ({ en: ' [static inference]', ru: ' [статический вывод]', zh: ' [静态推断]', de: ' [statische Ableitung]', es: ' [inferencia estática]' } as Record<Language, string>)[language]
    : ''
  const subject = SEMANTIC_GENERIC_SUBJECT_CODES.has(fact.code) ? '' : ` «${fact.subject}»`

  if (fact.level === 'fallback') {
    if (language === 'ru') return `Вероятно изменено содержимое «${fact.subject}», но точное функциональное назначение статически не определено${details}.${evidence}`
    if (language === 'zh') return `“${fact.subject}”的内容发生变化，但静态分析无法准确确定其功能目的${details}。${evidence}`
    if (language === 'de') return `Der Inhalt von „${fact.subject}“ wurde vermutlich geändert; die genaue funktionale Bedeutung konnte statisch nicht bestimmt werden${details}.${evidence}`
    if (language === 'es') return `Probablemente cambió el contenido de «${fact.subject}», pero el análisis estático no pudo determinar su propósito funcional exacto${details}.${evidence}`
    return `The content of “${fact.subject}” appears to have changed, but its exact functional purpose could not be determined statically${details}.${evidence}`
  }

  if (language === 'ru') return `${operation}: ${noun}${subject}${details}.${inference}${evidence}`
  if (language === 'zh') return `${operation}${noun}${SEMANTIC_GENERIC_SUBJECT_CODES.has(fact.code) ? '' : `“${fact.subject}”`}${details}。${inference}${evidence}`
  if (language === 'de') return `${operation}: ${noun}${SEMANTIC_GENERIC_SUBJECT_CODES.has(fact.code) ? '' : ` „${fact.subject}“`}${details}.${inference}${evidence}`
  if (language === 'es') return `${operation}: ${noun}${subject}${details}.${inference}${evidence}`
  return `${operation}: ${noun}${SEMANTIC_GENERIC_SUBJECT_CODES.has(fact.code) ? '' : ` “${fact.subject}”`}${details}.${inference}${evidence}`
}

function semanticBullets(language: Language, commit: InferredCommit, level: 'functional' | 'structural' | 'fallback'): string[] {
  return commit.semantic.facts.filter((fact) => fact.level === level).map((fact) => renderSemanticFact(language, fact))
}

function verificationBullets(language: Language, transition: VersionTransition, commit: InferredCommit): string[] {
  const binaryCount = commit.changes.filter((change) => change.binary).length
  const scope = transition.scope
  const semantic = commit.semantic
  if (language === 'ru') {
    const lines = [
      `Для всех анализируемых файлов рассчитаны SHA-256; совпадающих путей между архивами — ${scope.commonPathCount}.`,
      scope.commonPathCount
        ? `Из совпадающих путей изменено ${scope.modifiedCommonPathCount}, без изменений — ${scope.unchangedCommonPathCount}.`
        : 'Совпадающих путей нет, поэтому сравнение старого и нового содержимого одного и того же файла не выполнялось.',
      `Семантический анализ выполнен для ${semantic.analyzedTextFiles} из ${semantic.candidateTextFiles} затронутых текстовых файлов; покрытие функциональным или fallback-описанием — ${semantic.coveragePercent}%.`,
      `Получено семантических фактов: ${semantic.facts.length}; языки и форматы: ${semantic.detectedLanguages.join(', ') || 'не определены'}.`,
      `Режим сравнения: «${resolvedModeLabel(language, scope)}». Уверенность реконструкции истории — ${historyConfidenceLabel(language, scope.historyConfidence)} (${scope.historyConfidencePercent}%).`,
      `Уверенность тематической классификации — ${commit.classificationConfidence}%; это не вероятность существования исходного Git-коммита.`,
    ]
    if (semantic.fallbackTextFiles) lines.push(`Для ${semantic.fallbackTextFiles} файлов назначение изменения не удалось определить точно; они вынесены в раздел проверки, а не скрыты из отчёта.`)
    if (semantic.truncatedFacts) lines.push(`Из-за ограничения размера отчёта скрыто низкоприоритетных фактов: ${semantic.truncatedFacts}.`)
    if (binaryCount) lines.push(`Бинарных затронутых файлов: ${binaryCount}; для них доступны размер и хеш, но не функциональный анализ содержимого.`)
    if (!scope.removalsReliable) lines.push(`Удаления не подтверждаются: ${scope.ignoredPotentialRemovals} отсутствующих путей намеренно исключены из списка удалённых.`)
    lines.push('Семантические выводы построены статическим анализом сигнатур, маршрутов, SQL, конфигурации и характерных конструкций; приложение не выполняло исходный код.')
    lines.push('PHP lint, миграции базы, интерфейс и автотесты не запускались; указанные функции подтверждаются кодом, но их работоспособность требует отдельного запуска.')
    lines.push('Один переход между архивами представлен одним реконструированным набором изменений, а не набором выдуманных исторических коммитов.')
    return lines
  }

  const lines = [
    `SHA-256 checksums were calculated for all analyzed files; matching paths across archives: ${scope.commonPathCount}.`,
    scope.commonPathCount ? `${scope.modifiedCommonPathCount} matching paths changed and ${scope.unchangedCommonPathCount} stayed unchanged.` : 'There are no matching paths, so old/new content of the same file could not be compared.',
    `Semantic analysis covered ${semantic.analyzedTextFiles} of ${semantic.candidateTextFiles} affected text files; description coverage: ${semantic.coveragePercent}%.`,
    `Semantic facts: ${semantic.facts.length}; detected languages and formats: ${semantic.detectedLanguages.join(', ') || 'unknown'}.`,
    `Comparison mode: “${resolvedModeLabel(language, scope)}”. History confidence: ${historyConfidenceLabel(language, scope.historyConfidence)} (${scope.historyConfidencePercent}%).`,
    `Topic classification confidence: ${commit.classificationConfidence}%; this is not the probability that an original Git commit existed.`,
  ]
  if (semantic.fallbackTextFiles) lines.push(`${semantic.fallbackTextFiles} files could not be classified precisely and were explicitly placed in the review section.`)
  if (binaryCount) lines.push(`${binaryCount} binary files were checked by size/hash only and were not semantically inspected.`)
  if (!scope.removalsReliable) lines.push(`Deletions are not confirmed; ${scope.ignoredPotentialRemovals} absent paths were intentionally excluded.`)
  lines.push('Semantic statements are produced by static analysis of symbols, routes, SQL, configuration, and recognizable code constructs; the source code was not executed.')
  lines.push('Linters, migrations, UI checks, and automated tests were not run; runtime behavior still requires verification.')
  return lines
}

function padLabel(label: string, width = 18): string {
  return `${label}:`.padEnd(width, ' ')
}

function dossierType(language: Language, commit: InferredCommit): string {
  if (commit.featureTags.includes('student_cabinet')) {
    if (language === 'ru') return 'MVP личного кабинета'
    if (language === 'zh') return '个人中心 MVP'
    if (language === 'de') return 'MVP des Benutzerportals'
    if (language === 'es') return 'MVP del área personal'
    return 'User cabinet MVP'
  }
  const functional = commit.semantic.facts.filter((fact) => fact.level === 'functional').slice(0, 3)
  if (functional.length) return functional.map((fact) => SEMANTIC_NOUNS[language][fact.code]).join(' / ')
  return commit.categories.slice(0, 4).map((category) => categoryLabel(language, category)).join(' / ')
}

export function buildCommitDossier(options: {
  transition: VersionTransition
  commit: InferredCommit
  serial: number
  language: Language
  domain: string
  sourceNote: string
  status: CommitStatusMode
}): string {
  const { transition, commit, serial, language, domain, sourceNote, status } = options
  const c = COPY[language]
  const sections = SECTION_LABELS[language]
  const version = `LOCAL-${String(serial).padStart(4, '0')}`
  const source = sourceNote.trim() || transition.to.sourceName
  const files = commit.changes.map((change) => `  • ${change.path}`)
  const functional = semanticBullets(language, commit, 'functional').map((line) => `  • ${line}`)
  const structural = semanticBullets(language, commit, 'structural').map((line) => `  • ${line}`)
  const fallback = semanticBullets(language, commit, 'fallback').map((line) => `  • ${line}`)
  const fileSummary = fileSummaryBullets(language, transition, commit).map((line) => `  • ${line}`)
  const verification = verificationBullets(language, transition, commit).map((line) => `  • ${line}`)
  const modeLabel = language === 'ru' ? 'Режим' : 'Mode'

  const blocks: string[] = [
    `${padLabel(c.version)}${version}`,
    `${padLabel(c.domain)}${domain.trim() || '—'}`,
    `${padLabel(c.dateTime)}${preciseDate(transition.to, language)}`,
    `${padLabel(c.type)}${dossierType(language, commit)}`,
    `${padLabel(c.status)}${commitStatusLabel(language, status)}`,
    `${padLabel(c.source)}${source}`,
    `${padLabel(modeLabel)}${resolvedModeLabel(language, transition.scope)}`,
  ]

  if (functional.length) blocks.push('', `${sections.functional}:`, ...functional)
  if (structural.length) blocks.push('', `${sections.structural}:`, ...structural)
  if (fallback.length) blocks.push('', `${sections.fallback}:`, ...fallback)
  blocks.push('', `${sections.fileSummary}:`, ...fileSummary)
  blocks.push('', `${c.affectedFiles}:`, ...files)
  blocks.push('', `${c.verification}:`, ...verification)
  return blocks.join('\n')
}

export function buildDetailedReport(options: {
  report: AnalysisReport
  language: Language
  domain: string
  sourceNote: string
  status: CommitStatusMode
}): string {
  let serial = 1
  const chunks: string[] = []
  for (const transition of options.report.transitions) {
    for (const commit of transition.commits) {
      chunks.push(buildCommitDossier({ ...options, transition, commit, serial }))
      serial += 1
    }
  }
  return chunks.join('\n\n' + '─'.repeat(76) + '\n\n')
}

export function lineDeltaLabel(change: import('./lib/types').FileChange): string {
  if (change.binary) return `${change.sizeBefore} B → ${change.sizeAfter} B`
  const parts: string[] = []
  if (change.addedLines) parts.push(`+${change.addedLines}`)
  if (change.removedLines) parts.push(`−${change.removedLines}`)
  return parts.join(' / ') || '0'
}
