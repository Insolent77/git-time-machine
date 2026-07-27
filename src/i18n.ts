import type { AnalysisReport, ChangeCategory, ChangeStatus, FileChange, InferredCommit, VersionTransition } from './lib/types'
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
    tagline: 'ARCHIVE → HISTORY', heroTitle: 'Git Time Machine', heroText: 'Compare dated project archives and reconstruct a reviewable development timeline.', localOnly: 'Processed locally. Source code never leaves the browser.', upload: 'Upload archives', demo: 'Open demo', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Versions', noArchives: 'No archives selected', selectFiles: 'Choose files', dropHint: 'Drop two or more project archives here', addAnother: 'Add archives', clear: 'Clear', analyze: 'Reconstruct history', analyzing: 'Analyzing', needTwo: 'Add at least two versions.', versionLabel: 'Version', captureDate: 'Date', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', commitSettings: 'Commit metadata', projectDomain: 'Project domain', sourceNote: 'Source note', status: 'Status', statusReconstructed: 'Reconstructed — review required', statusImplemented: 'Implemented locally', statusVerified: 'Implemented and checked locally', optional: 'optional', results: 'Reconstructed history', commits: 'Commits', files: 'Files', export: 'Export', search: 'Search file path', all: 'All', added: 'Added', modified: 'Modified', removed: 'Removed', noChanges: 'No changes found between these versions.', confidence: 'confidence', copy: 'Copy', copied: 'Copied', downloadAll: 'Download report', downloadJson: 'JSON', errorTitle: 'Analysis stopped', archive: 'Archive', reason: 'Reason', howToFix: 'How to fix', technical: 'Technical detail', unsupportedSelected: 'Unsupported files were not added.', skippedFiles: 'Skipped', errorMinimum: 'At least two supported archives are required.', errorCopy: 'Clipboard access was blocked.', progressOpening: 'Opening archive engine', progressExtracting: 'Extracting', progressHashing: 'Hashing and reading files', buildLabel: 'BUILD 0.4', privacy: 'All analysis runs in this browser.', sourceCode: 'GitHub', detailedCommit: 'Detailed commit', affectedFiles: 'AFFECTED FILES', verification: 'VERIFICATION', changedAdded: 'CHANGED / ADDED', type: 'Type', dateTime: 'Date and time', source: 'Source', version: 'Version', domain: 'Domain', filterNothing: 'Nothing matches the filter.',
  },
  ru: {
    tagline: 'АРХИВ → ИСТОРИЯ', heroTitle: 'Git Time Machine', heroText: 'Сравнивает архивы проекта по датам и восстанавливает проверяемую историю разработки.', localOnly: 'Обработка локальная. Исходный код не покидает браузер.', upload: 'Загрузить архивы', demo: 'Открыть демо', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Версии', noArchives: 'Архивы не выбраны', selectFiles: 'Выбрать файлы', dropHint: 'Перетащите сюда минимум два архива проекта', addAnother: 'Добавить архивы', clear: 'Очистить', analyze: 'Восстановить историю', analyzing: 'Анализируем', needTwo: 'Добавьте минимум две версии.', versionLabel: 'Версия', captureDate: 'Дата', moveUp: 'Поднять', moveDown: 'Опустить', remove: 'Удалить', commitSettings: 'Метаданные коммитов', projectDomain: 'Домен проекта', sourceNote: 'Источник / примечание', status: 'Статус', statusReconstructed: 'Реконструировано — нужна проверка', statusImplemented: 'Реализовано локально', statusVerified: 'Реализовано и проверено локально', optional: 'необязательно', results: 'Восстановленная история', commits: 'Коммиты', files: 'Файлы', export: 'Экспорт', search: 'Поиск по пути файла', all: 'Все', added: 'Добавлен', modified: 'Изменён', removed: 'Удалён', noChanges: 'Между версиями изменений не найдено.', confidence: 'уверенность', copy: 'Копировать', copied: 'Скопировано', downloadAll: 'Скачать отчёт', downloadJson: 'JSON', errorTitle: 'Анализ остановлен', archive: 'Архив', reason: 'Причина', howToFix: 'Что сделать', technical: 'Техническая деталь', unsupportedSelected: 'Файлы неподдерживаемых форматов не добавлены.', skippedFiles: 'Пропущены', errorMinimum: 'Нужно минимум два поддерживаемых архива.', errorCopy: 'Браузер запретил доступ к буферу обмена.', progressOpening: 'Запуск архивного движка', progressExtracting: 'Распаковка', progressHashing: 'Хеширование и чтение файлов', buildLabel: 'СБОРКА 0.4', privacy: 'Весь анализ выполняется в этом браузере.', sourceCode: 'GitHub', detailedCommit: 'Подробный коммит', affectedFiles: 'ЗАТРОНУТЫЕ ФАЙЛЫ', verification: 'ПРОВЕРКА', changedAdded: 'ИЗМЕНЕНО / ДОБАВЛЕНО', type: 'Тип', dateTime: 'Дата и время', source: 'Источник', version: 'Версия', domain: 'Домен', filterNothing: 'По выбранному фильтру ничего не найдено.',
  },
  zh: {
    tagline: '归档 → 历史', heroTitle: 'Git Time Machine', heroText: '比较不同日期的项目归档，并重建可审阅的开发时间线。', localOnly: '完全在本地处理，源代码不会离开浏览器。', upload: '上传归档', demo: '打开演示', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: '版本', noArchives: '尚未选择归档', selectFiles: '选择文件', dropHint: '拖入至少两个项目归档', addAnother: '添加归档', clear: '清空', analyze: '重建历史', analyzing: '分析中', needTwo: '请至少添加两个版本。', versionLabel: '版本', captureDate: '日期', moveUp: '上移', moveDown: '下移', remove: '删除', commitSettings: '提交元数据', projectDomain: '项目域名', sourceNote: '来源说明', status: '状态', statusReconstructed: '已重建 — 需要审阅', statusImplemented: '已在本地实现', statusVerified: '已在本地实现并检查', optional: '可选', results: '重建历史', commits: '提交', files: '文件', export: '导出', search: '搜索文件路径', all: '全部', added: '新增', modified: '修改', removed: '删除', noChanges: '这些版本之间未发现变化。', confidence: '置信度', copy: '复制', copied: '已复制', downloadAll: '下载报告', downloadJson: 'JSON', errorTitle: '分析已停止', archive: '归档', reason: '原因', howToFix: '解决方法', technical: '技术细节', unsupportedSelected: '不支持格式的文件未添加。', skippedFiles: '已跳过', errorMinimum: '至少需要两个受支持的归档。', errorCopy: '浏览器阻止了剪贴板访问。', progressOpening: '启动归档引擎', progressExtracting: '解压中', progressHashing: '哈希并读取文件', buildLabel: '版本 0.4', privacy: '所有分析都在当前浏览器中运行。', sourceCode: 'GitHub', detailedCommit: '详细提交', affectedFiles: '受影响文件', verification: '验证', changedAdded: '更改 / 新增', type: '类型', dateTime: '日期和时间', source: '来源', version: '版本', domain: '域名', filterNothing: '没有匹配筛选条件的内容。',
  },
  de: {
    tagline: 'ARCHIV → VERLAUF', heroTitle: 'Git Time Machine', heroText: 'Vergleicht datierte Projektarchive und rekonstruiert einen prüfbaren Entwicklungsverlauf.', localOnly: 'Lokale Verarbeitung. Quellcode verlässt den Browser nicht.', upload: 'Archive laden', demo: 'Demo öffnen', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Versionen', noArchives: 'Keine Archive ausgewählt', selectFiles: 'Dateien wählen', dropHint: 'Mindestens zwei Projektarchive hier ablegen', addAnother: 'Archive hinzufügen', clear: 'Leeren', analyze: 'Verlauf rekonstruieren', analyzing: 'Analyse läuft', needTwo: 'Mindestens zwei Versionen hinzufügen.', versionLabel: 'Version', captureDate: 'Datum', moveUp: 'Nach oben', moveDown: 'Nach unten', remove: 'Entfernen', commitSettings: 'Commit-Metadaten', projectDomain: 'Projektdomain', sourceNote: 'Quellenhinweis', status: 'Status', statusReconstructed: 'Rekonstruiert — Prüfung nötig', statusImplemented: 'Lokal umgesetzt', statusVerified: 'Lokal umgesetzt und geprüft', optional: 'optional', results: 'Rekonstruierter Verlauf', commits: 'Commits', files: 'Dateien', export: 'Export', search: 'Dateipfad suchen', all: 'Alle', added: 'Hinzugefügt', modified: 'Geändert', removed: 'Entfernt', noChanges: 'Zwischen diesen Versionen wurden keine Änderungen gefunden.', confidence: 'Konfidenz', copy: 'Kopieren', copied: 'Kopiert', downloadAll: 'Bericht laden', downloadJson: 'JSON', errorTitle: 'Analyse angehalten', archive: 'Archiv', reason: 'Grund', howToFix: 'Lösung', technical: 'Technisches Detail', unsupportedSelected: 'Nicht unterstützte Dateien wurden nicht hinzugefügt.', skippedFiles: 'Übersprungen', errorMinimum: 'Mindestens zwei unterstützte Archive sind erforderlich.', errorCopy: 'Der Browser hat den Zugriff auf die Zwischenablage blockiert.', progressOpening: 'Archiv-Engine starten', progressExtracting: 'Entpacken', progressHashing: 'Dateien hashen und lesen', buildLabel: 'BUILD 0.4', privacy: 'Die gesamte Analyse läuft in diesem Browser.', sourceCode: 'GitHub', detailedCommit: 'Detaillierter Commit', affectedFiles: 'BETROFFENE DATEIEN', verification: 'PRÜFUNG', changedAdded: 'GEÄNDERT / HINZUGEFÜGT', type: 'Typ', dateTime: 'Datum und Uhrzeit', source: 'Quelle', version: 'Version', domain: 'Domain', filterNothing: 'Kein Treffer für den Filter.',
  },
  es: {
    tagline: 'ARCHIVO → HISTORIA', heroTitle: 'Git Time Machine', heroText: 'Compara archivos fechados del proyecto y reconstruye un historial de desarrollo revisable.', localOnly: 'Procesamiento local. El código fuente no sale del navegador.', upload: 'Subir archivos', demo: 'Abrir demo', supported: 'ZIP · RAR · 7Z · TAR · GZ · BZ2 · XZ', versions: 'Versiones', noArchives: 'No hay archivos seleccionados', selectFiles: 'Elegir archivos', dropHint: 'Suelta aquí al menos dos archivos del proyecto', addAnother: 'Añadir archivos', clear: 'Limpiar', analyze: 'Reconstruir historial', analyzing: 'Analizando', needTwo: 'Añade al menos dos versiones.', versionLabel: 'Versión', captureDate: 'Fecha', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Eliminar', commitSettings: 'Metadatos del commit', projectDomain: 'Dominio del proyecto', sourceNote: 'Nota de origen', status: 'Estado', statusReconstructed: 'Reconstruido — requiere revisión', statusImplemented: 'Implementado localmente', statusVerified: 'Implementado y comprobado localmente', optional: 'opcional', results: 'Historial reconstruido', commits: 'Commits', files: 'Archivos', export: 'Exportar', search: 'Buscar ruta de archivo', all: 'Todos', added: 'Añadido', modified: 'Modificado', removed: 'Eliminado', noChanges: 'No se encontraron cambios entre estas versiones.', confidence: 'confianza', copy: 'Copiar', copied: 'Copiado', downloadAll: 'Descargar informe', downloadJson: 'JSON', errorTitle: 'Análisis detenido', archive: 'Archivo', reason: 'Motivo', howToFix: 'Cómo resolverlo', technical: 'Detalle técnico', unsupportedSelected: 'Los archivos con formatos no compatibles no se añadieron.', skippedFiles: 'Omitidos', errorMinimum: 'Se necesitan al menos dos archivos compatibles.', errorCopy: 'El navegador bloqueó el portapapeles.', progressOpening: 'Iniciando motor de archivos', progressExtracting: 'Extrayendo', progressHashing: 'Calculando hashes y leyendo archivos', buildLabel: 'BUILD 0.4', privacy: 'Todo el análisis se ejecuta en este navegador.', sourceCode: 'GitHub', detailedCommit: 'Commit detallado', affectedFiles: 'ARCHIVOS AFECTADOS', verification: 'VERIFICACIÓN', changedAdded: 'CAMBIADO / AÑADIDO', type: 'Tipo', dateTime: 'Fecha y hora', source: 'Origen', version: 'Versión', domain: 'Dominio', filterNothing: 'Nada coincide con el filtro.',
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

function preciseDate(value: string): string {
  const date = new Date(value)
  const parts = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')]
  const time = [String(date.getHours()).padStart(2, '0'), String(date.getMinutes()).padStart(2, '0'), String(date.getSeconds()).padStart(2, '0')]
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'
  return `${parts.join('-')} ${time.join(':')} (${zone}, ${utcOffset(date)})`
}

function commitBullets(language: Language, commit: InferredCommit): string[] {
  const counts = {
    added: commit.changes.filter((change) => change.status === 'added').length,
    modified: commit.changes.filter((change) => change.status === 'modified').length,
    removed: commit.changes.filter((change) => change.status === 'removed').length,
  }
  const addedLines = commit.changes.reduce((sum, change) => sum + change.addedLines, 0)
  const removedLines = commit.changes.reduce((sum, change) => sum + change.removedLines, 0)
  const key = [...commit.changes]
    .sort((left, right) => (right.addedLines + right.removedLines + right.sizeAfter) - (left.addedLines + left.removedLines + left.sizeAfter))
    .slice(0, 4)
    .map((change) => change.path)

  if (language === 'ru') {
    const result: string[] = []
    if (counts.added) result.push(`Добавлено файлов: ${counts.added}; новые элементы относятся к разделу «${categoryLabel(language, commit.category)}».`)
    if (counts.modified) result.push(`Изменено файлов: ${counts.modified}; содержимое отличается от предыдущей версии по SHA-256.`)
    if (counts.removed) result.push(`Удалено файлов: ${counts.removed}; они присутствовали в предыдущем архиве и отсутствуют в текущем.`)
    if (addedLines || removedLines) result.push(`Оценка изменений текстовых файлов: +${addedLines} / −${removedLines} строк.`)
    if (key.length) result.push(`Ключевые пути этого этапа: ${key.join(', ')}.`)
    return result
  }

  const result: string[] = []
  if (counts.added) result.push(`${counts.added} files were added in “${categoryLabel(language, commit.category)}”.`)
  if (counts.modified) result.push(`${counts.modified} files changed and have different SHA-256 hashes from the previous version.`)
  if (counts.removed) result.push(`${counts.removed} files were present before and are absent from the current archive.`)
  if (addedLines || removedLines) result.push(`Estimated text delta: +${addedLines} / −${removedLines} lines.`)
  if (key.length) result.push(`Key paths: ${key.join(', ')}.`)
  return result
}

function verificationBullets(language: Language, commit: InferredCommit): string[] {
  const binaryCount = commit.changes.filter((change) => change.binary).length
  if (language === 'ru') {
    return [
      `Для ${commit.changes.length} затронутых файлов выполнено сравнение SHA-256 между соседними архивами.`,
      `Группировка в этот коммит построена по путям и типам файлов; уверенность модели — ${commit.confidence}%.`,
      binaryCount ? `Бинарных файлов: ${binaryCount}; для них проверен хеш и размер, но построчный diff не выполнялся.` : 'Для текстовых файлов рассчитана приблизительная разница добавленных и удалённых строк.',
      'Результат не доказывает фактическую историю Git и должен быть проверен владельцем проекта перед публикацией.',
    ]
  }
  return [
    `SHA-256 comparison completed for ${commit.changes.length} affected files across adjacent archives.`,
    `Commit grouping is inferred from paths and file types; model confidence is ${commit.confidence}%.`,
    binaryCount ? `${binaryCount} binary files were verified by hash and size; no line diff was attempted.` : 'An approximate added/removed line delta was calculated for text files.',
    'This reconstruction is not verified Git history and should be reviewed by the project owner before publication.',
  ]
}

function padLabel(label: string, width = 14): string {
  return `${label}:`.padEnd(width, ' ')
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
  const version = `LOCAL-${String(serial).padStart(4, '0')}`
  const source = sourceNote.trim() || `${transition.from.sourceName} → ${transition.to.sourceName}`
  const files = commit.changes.map((change) => `  • ${change.path}`)
  const changed = commitBullets(language, commit).map((line) => `  • ${line}`)
  const verification = verificationBullets(language, commit).map((line) => `  • ${line}`)

  return [
    `${padLabel(c.version)}${version}`,
    `${padLabel(c.domain)}${domain.trim() || '—'}`,
    `${padLabel(c.dateTime)}${preciseDate(transition.to.capturedAt)}`,
    `${padLabel(c.type)}${categoryLabel(language, commit.category)}`,
    `${padLabel(c.status)}${commitStatusLabel(language, status)}`,
    `${padLabel(c.source)}${source}`,
    '',
    `${c.changedAdded}:`,
    ...changed,
    '',
    `${c.affectedFiles}:`,
    ...files,
    '',
    `${c.verification}:`,
    ...verification,
  ].join('\n')
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

export function lineDeltaLabel(change: FileChange): string {
  if (change.binary) return `${change.sizeBefore} B → ${change.sizeAfter} B`
  const parts: string[] = []
  if (change.addedLines) parts.push(`+${change.addedLines}`)
  if (change.removedLines) parts.push(`−${change.removedLines}`)
  return parts.join(' / ') || '0'
}
