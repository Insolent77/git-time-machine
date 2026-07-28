import type {
  FileChange,
  SemanticAnalysis,
  SemanticCertainty,
  SemanticFact,
  SemanticFactCode,
  SemanticLevel,
  SemanticOperation,
  Snapshot,
  SnapshotFile,
} from './types'

const MAX_FACTS = 160
const MAX_DETAILS = 12
const MAX_EXCERPT = 180

interface NamedBlock {
  kind: 'function' | 'class' | 'interface' | 'type_definition' | 'component'
  name: string
  line: number
  signature: string
  bodyHash: string
}

interface RouteInfo {
  method: string
  path: string
  line: number
  fingerprint: string
}

interface FeatureRule {
  code: SemanticFactCode
  level: SemanticLevel
  confidence: number
  subject: string
  patterns: RegExp[]
  pathPatterns?: RegExp[]
}

interface FactInput {
  code: SemanticFactCode
  operation: SemanticOperation
  certainty?: SemanticCertainty
  level: SemanticLevel
  confidence: number
  subject: string
  path: string
  line?: number
  symbol?: string
  excerpt?: string
  details?: string[]
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  php: 'PHP', js: 'JavaScript', jsx: 'JavaScript/React', mjs: 'JavaScript', cjs: 'JavaScript',
  ts: 'TypeScript', tsx: 'TypeScript/React', vue: 'Vue', svelte: 'Svelte', py: 'Python',
  sql: 'SQL', html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', sass: 'Sass', less: 'Less',
  json: 'JSON', jsonc: 'JSON', yaml: 'YAML', yml: 'YAML', xml: 'XML', md: 'Markdown', mdx: 'MDX',
  java: 'Java', kt: 'Kotlin', kts: 'Kotlin', cs: 'C#', go: 'Go', rb: 'Ruby', rs: 'Rust',
  c: 'C', cpp: 'C++', h: 'C/C++', hpp: 'C++', sh: 'Shell', bash: 'Shell', ps1: 'PowerShell',
}

const FEATURE_RULES: FeatureRule[] = [
  { code: 'authentication', level: 'functional', confidence: 82, subject: 'authentication flow', patterns: [/password_verify\s*\(/i, /sign[ -]?in|log[ -]?in|authenticate|авторизац|вход в (?:систему|аккаунт)/i], pathPatterns: [/(?:^|\/)auth(?:\/|$)/i, /login/i] },
  { code: 'logout', level: 'functional', confidence: 91, subject: 'logout flow', patterns: [/session_destroy|logout|log[ -]?out|выход из (?:системы|аккаунта)/i], pathPatterns: [/logout/i] },
  { code: 'user_cabinet', level: 'functional', confidence: 88, subject: 'personal account area', patterns: [/личн(?:ый|ого) кабинет|user cabinet|personal account|dashboard/i], pathPatterns: [/lk\./i] },
  { code: 'contract_section', level: 'functional', confidence: 90, subject: 'contract section', patterns: [/договор|contract_clients|valid_contract|signed contract/i], pathPatterns: [/(?:^|\/)contract(?:\/|$)/i] },
  { code: 'schedule_section', level: 'functional', confidence: 90, subject: 'schedule section', patterns: [/расписание|calendar-controls|data-calendar|schedule/i], pathPatterns: [/(?:^|\/)schedule(?:\/|$)/i] },
  { code: 'payments_section', level: 'functional', confidence: 90, subject: 'payments and receipts section', patterns: [/оплаты|чеки|payments?|receipts?/i], pathPatterns: [/(?:^|\/)payments?(?:\/|$)/i] },
  { code: 'homework_section', level: 'functional', confidence: 90, subject: 'homework section', patterns: [/домашн(?:ее|яя) задани|homework/i], pathPatterns: [/(?:^|\/)homework(?:\/|$)/i] },
  { code: 'profile_settings', level: 'functional', confidence: 88, subject: 'profile and password settings', patterns: [/настройки|profile settings|изменить пароль|создать пароль/i], pathPatterns: [/(?:^|\/)settings(?:\/|$)/i] },
  { code: 'shared_navigation', level: 'functional', confidence: 86, subject: 'shared page layout and navigation', patterns: [/page_header|page_footer|sidebar|navigation|главная|навигац/i], pathPatterns: [/(?:^|\/)includes\/layout\./i] },
  { code: 'installation_setup', level: 'functional', confidence: 91, subject: 'installation and setup instructions', patterns: [/php\s*8\.|phpmyadmin|installation|установк|настройк.{0,20}окружен/i], pathPatterns: [/(?:install|readme-setup)/i] },
  { code: 'one_time_code', level: 'functional', confidence: 94, subject: 'one-time authentication code', patterns: [/one[ -]?time|otp\b|verification code|auth_codes?|issue_code|verify_code|одноразов|код(?:а)? подтвержден/i] },
  { code: 'password_security', level: 'functional', confidence: 96, subject: 'password hashing and verification', patterns: [/password_hash\s*\(|password_verify\s*\(|bcrypt|argon2|scrypt|pbkdf2/i] },
  { code: 'csrf_protection', level: 'functional', confidence: 97, subject: 'CSRF protection', patterns: [/csrf[_-]?(?:token|verify|check)|xsrf/i] },
  { code: 'session_security', level: 'functional', confidence: 92, subject: 'session security', patterns: [/session_set_cookie_params|httponly|samesite|secure\s*=>|regenerateid|session_regenerate_id/i] },
  { code: 'authorization', level: 'functional', confidence: 88, subject: 'role and permission checks', patterns: [/permission|authorize|authorization|require_role|has_role|can\s*\(|доступ|роль пользователя/i] },
  { code: 'email_delivery', level: 'functional', confidence: 91, subject: 'email delivery', patterns: [/smtp|phpmailer|nodemailer|sendmail|\bmail\s*\(|send_email|отправ(?:ить|ка) письм/i] },
  { code: 'file_upload', level: 'functional', confidence: 94, subject: 'file upload', patterns: [/multipart\/form-data|type\s*=\s*["']file|move_uploaded_file|formdata\s*\(|upload(?:file)?\s*\(/i] },
  { code: 'file_download', level: 'functional', confidence: 91, subject: 'file download or export', patterns: [/content-disposition|download\s*=|createobjecturl|filesaver|export(?:csv|pdf|json|file)|скачать|выгрузить/i] },
  { code: 'search', level: 'functional', confidence: 82, subject: 'search', patterns: [/search(?:input|query|params)?|поиск|ilike|match\s*\(|fulltext/i] },
  { code: 'filtering', level: 'functional', confidence: 80, subject: 'filtering', patterns: [/\.filter\s*\(|\bfilters?\b|\bfiltering\b|фильтр|where\s+.+(?:=|like|in\s*\()/i] },
  { code: 'sorting', level: 'functional', confidence: 84, subject: 'sorting', patterns: [/\.sort\s*\(|order\s+by|sort(?:able|ing)?|сортиров/i] },
  { code: 'pagination', level: 'functional', confidence: 91, subject: 'pagination', patterns: [/pagination|page_size|per_page|offset\s+\d|paginate\s*\(/i] },
  { code: 'modal_dialog', level: 'functional', confidence: 88, subject: 'modal dialog', patterns: [/<dialog\b|showmodal\s*\(|aria-modal|modal(?:-overlay|-dialog|__content)?|модальн/i] },
  { code: 'responsive_layout', level: 'functional', confidence: 90, subject: 'responsive layout', patterns: [/@media\s*\(|matchmedia\s*\(|viewport|safe-area-inset|mobile[-_ ](?:menu|nav|layout)/i] },
  { code: 'animation', level: 'functional', confidence: 88, subject: 'interface animation', patterns: [/@keyframes|animation(?:-name)?\s*:|requestanimationframe|web animations|transition\s*:/i] },
  { code: 'layout_system', level: 'structural', confidence: 83, subject: 'layout system', patterns: [/display\s*:\s*(?:grid|flex)|grid-template|flex-direction|container-type/i] },
  { code: 'localization', level: 'functional', confidence: 88, subject: 'localization and language switching', patterns: [/i18n|locale|translations?|language[_-]?switch|setlanguage|data-language|переключен.{0,12}язык/i] },
  { code: 'browser_storage', level: 'functional', confidence: 94, subject: 'browser-side state persistence', patterns: [/localstorage|sessionstorage|indexeddb|caches\.open/i] },
  { code: 'caching', level: 'functional', confidence: 88, subject: 'caching', patterns: [/cache-control|redis|memcache|caches\.open|serviceworker|etag/i] },
  { code: 'logging', level: 'structural', confidence: 82, subject: 'application logging', patterns: [/console\.(?:log|warn|error)|logger\.|logging\.|error_log\s*\(|monolog|winston/i] },
  { code: 'realtime_connection', level: 'functional', confidence: 95, subject: 'real-time connection', patterns: [/websocket|socket\.io|eventsource|server-sent events|sse\b/i] },
  { code: 'background_worker', level: 'functional', confidence: 92, subject: 'background processing', patterns: [/new\s+worker\s*\(|serviceworker|queue|job\b|cron\b|background task/i] },
  { code: 'drag_and_drop', level: 'functional', confidence: 91, subject: 'drag-and-drop interaction', patterns: [/dragstart|dragover|drop\b|draggable|dataTransfer/i] },
  { code: 'validation', level: 'functional', confidence: 84, subject: 'input validation', patterns: [/validate|validation|required\b|filter_var|preg_match|schema\.parse|zod|yup|валид/i] },
  { code: 'error_handling', level: 'structural', confidence: 78, subject: 'error handling', patterns: [/try\s*\{|catch\s*\(|throw\s+new|except\s+|http_response_code|set_error_handler/i] },
  { code: 'json_api', level: 'functional', confidence: 91, subject: 'JSON API response', patterns: [/json_encode|response\.json|jsonresponse|application\/json|return\s+jsonify/i] },
  { code: 'redirect_navigation', level: 'functional', confidence: 86, subject: 'redirect or navigation flow', patterns: [/header\s*\(\s*["']location:|redirect\s*\(|location\.href|navigate\s*\(|router\.push/i] },
  { code: 'configuration', level: 'structural', confidence: 78, subject: 'project configuration', patterns: [/define\s*\(|process\.env|import\.meta\.env|getenv\s*\(|config\s*\[/i], pathPatterns: [/(?:^|\/)config(?:\/|\.)/i, /\.env/i] },
  { code: 'ci_pipeline', level: 'functional', confidence: 96, subject: 'continuous integration pipeline', patterns: [/jobs:\s*\n|uses:\s*actions\//i], pathPatterns: [/\.github\/workflows\//i] },
  { code: 'containerization', level: 'structural', confidence: 96, subject: 'containerized runtime', patterns: [/^from\s+\S+/im, /docker compose|services:\s*\n/i], pathPatterns: [/dockerfile/i, /docker-compose/i] },
  { code: 'access_rule', level: 'functional', confidence: 92, subject: 'server access rule', patterns: [/require\s+all|rewrite(rule|cond)|deny\s+from|allow\s+from|authType/i], pathPatterns: [/\.htaccess$/i, /nginx/i] },
]

function stableId(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

function shortHash(value: string): string {
  return stableId(value)
}

function extensionOf(path: string): string {
  const fileName = path.split('/').at(-1)?.toLowerCase() ?? ''
  if (fileName === 'dockerfile') return 'dockerfile'
  return fileName.includes('.') ? fileName.split('.').at(-1) ?? '' : fileName
}

function languageOf(path: string): string | undefined {
  const fileName = path.split('/').at(-1)?.toLowerCase() ?? ''
  if (fileName === 'dockerfile') return 'Dockerfile'
  if (fileName === '.htaccess') return 'Apache configuration'
  return LANGUAGE_BY_EXTENSION[extensionOf(path)]
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, Math.max(index, 0)).split('\n').length
}

function excerptAt(content: string, index: number): string {
  const lineStart = content.lastIndexOf('\n', index) + 1
  const nextBreak = content.indexOf('\n', index)
  const lineEnd = nextBreak === -1 ? content.length : nextBreak
  return content.slice(lineStart, lineEnd).trim().replace(/\s+/g, ' ').slice(0, MAX_EXCERPT)
}

function findClosingBrace(content: string, openingIndex: number): number {
  let depth = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = openingIndex; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return Math.min(content.length, openingIndex + 1000)
}

function braceBlockHash(content: string, matchIndex: number, signatureEnd: number): string {
  const opening = content.indexOf('{', signatureEnd)
  if (opening === -1 || opening - signatureEnd > 300) return shortHash(content.slice(matchIndex, Math.min(content.length, signatureEnd + 500)))
  const closing = findClosingBrace(content, opening)
  return shortHash(content.slice(matchIndex, closing + 1).replace(/\s+/g, ' '))
}

function pythonBlockHash(content: string, matchIndex: number): string {
  const lines = content.slice(matchIndex).split(/\r?\n/)
  const first = lines[0] ?? ''
  const indent = first.match(/^\s*/)?.[0].length ?? 0
  const selected = [first]
  for (const line of lines.slice(1)) {
    if (!line.trim()) {
      selected.push(line)
      continue
    }
    const currentIndent = line.match(/^\s*/)?.[0].length ?? 0
    if (currentIndent <= indent) break
    selected.push(line)
  }
  return shortHash(selected.join('\n').replace(/\s+/g, ' '))
}

function extractNamedBlocks(content: string, path: string): NamedBlock[] {
  const extension = extensionOf(path)
  const output: NamedBlock[] = []
  const seen = new Set<string>()
  const addMatches = (kind: NamedBlock['kind'], pattern: RegExp, nameGroup = 1, componentHint = false) => {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const name = match[nameGroup]?.trim()
      if (!name || name.length > 120) continue
      const resolvedKind = componentHint && /^[A-Z]/.test(name) ? 'component' : kind
      const key = `${resolvedKind}:${name}`
      if (seen.has(key)) continue
      seen.add(key)
      const index = match.index ?? 0
      const signature = match[0].trim().replace(/\s+/g, ' ').slice(0, 240)
      const bodyHash = extension === 'py' ? pythonBlockHash(content, index) : braceBlockHash(content, index, index + match[0].length)
      output.push({ kind: resolvedKind, name, line: lineNumberAt(content, index), signature, bodyHash })
    }
  }

  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'svelte'].includes(extension)) {
    addMatches('function', /(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g, 1, true)
    addMatches('function', /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(?:\{|[^;\n]+)/g, 1, true)
    addMatches('class', /(?:export\s+(?:default\s+)?)?class\s+([A-Za-z_$][\w$]*)\b[^\{]*\{/g)
    addMatches('interface', /(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)\b[^\{]*\{/g)
    addMatches('type_definition', /(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=/g)
  } else if (extension === 'php') {
    addMatches('function', /(?:public|protected|private|static|final|abstract|\s)*function\s+&?\s*([A-Za-z_][\w]*)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\{/g)
    addMatches('class', /(?:final\s+|abstract\s+)?class\s+([A-Za-z_][\w]*)\b[^\{]*\{/g)
    addMatches('interface', /interface\s+([A-Za-z_][\w]*)\b[^\{]*\{/g)
  } else if (extension === 'py') {
    addMatches('function', /^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)\s*\([^\n]*\)\s*(?:->\s*[^:]+)?\s*:/gm)
    addMatches('class', /^\s*class\s+([A-Za-z_][\w]*)\b[^:]*:/gm)
  } else if (extension === 'go') {
    addMatches('function', /func\s+(?:\([^)]*\)\s*)?([A-Za-z_][\w]*)\s*\([^)]*\)[^{]*\{/g)
    addMatches('type_definition', /type\s+([A-Za-z_][\w]*)\s+(?:struct|interface)\s*\{/g)
  } else if (['java', 'kt', 'kts', 'cs', 'cpp', 'c', 'h', 'hpp', 'rs', 'rb'].includes(extension)) {
    addMatches('class', /(?:public\s+|private\s+|protected\s+|internal\s+|abstract\s+|final\s+|sealed\s+)*class\s+([A-Za-z_][\w]*)\b[^\{]*\{/g)
    addMatches('interface', /(?:public\s+|internal\s+)*interface\s+([A-Za-z_][\w]*)\b[^\{]*\{/g)
    addMatches('function', /(?:public|private|protected|internal|static|async|virtual|override|final|synchronized|inline|suspend|fun|fn|def|\s)+\s+[\w<>,?\[\]:*&]+\s+([A-Za-z_][\w]*)\s*\([^;{}]*\)\s*(?:->\s*[^\{]+)?\{/g)
  }

  return output
}

function extractRoutes(content: string): RouteInfo[] {
  const patterns = [
    /(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*["']([^"']+)["']/gi,
    /@(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*["']([^"']+)["']/gi,
    /\bpath\s*\(\s*["']([^"']+)["']/gi,
    /\bre_path\s*\(\s*r?["']([^"']+)["']/gi,
    /\[(?:HttpGet|HttpPost|HttpPut|HttpPatch|HttpDelete)\s*\(\s*["']?([^"'\]]*)/gi,
  ]
  const routes: RouteInfo[] = []
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const first = match[1] ?? ''
      const second = match[2]
      const method = second ? first.toUpperCase() : pattern.source.includes('path') ? 'ROUTE' : 'HTTP'
      const path = (second ?? first).trim() || '/'
      routes.push({ method, path, line: lineNumberAt(content, match.index ?? 0), fingerprint: shortHash(content.slice(Math.max(0, (match.index ?? 0) - 80), Math.min(content.length, (match.index ?? 0) + 480)).replace(/\s+/g, ' ')) })
    }
  }
  return routes
}

function extractApiRequests(content: string): RouteInfo[] {
  const output: RouteInfo[] = []
  const patterns = [
    /fetch\s*\(\s*["'`]([^"'`]+)["'`](?:\s*,\s*\{[\s\S]{0,300}?method\s*:\s*["'](GET|POST|PUT|PATCH|DELETE)["'])?/gi,
    /axios\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /(?:http|client)\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
  ]
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const axiosStyle = Boolean(match[2] && /^(get|post|put|patch|delete)$/i.test(match[1] ?? ''))
      const path = axiosStyle ? match[2] : match[1]
      const method = axiosStyle ? (match[1] ?? 'GET').toUpperCase() : (match[2] ?? 'GET').toUpperCase()
      if (!path) continue
      output.push({ method, path, line: lineNumberAt(content, match.index ?? 0), fingerprint: shortHash(content.slice(Math.max(0, (match.index ?? 0) - 80), Math.min(content.length, (match.index ?? 0) + 480)).replace(/\s+/g, ' ')) })
    }
  }
  return output
}

function uniqueByKey<T>(items: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const current = key(item)
    if (seen.has(current)) return false
    seen.add(current)
    return true
  })
}

function matchSetDiff<T>(before: T[], after: T[], key: (value: T) => string): { added: T[]; removed: T[]; common: Array<[T, T]> } {
  const beforeMap = new Map(before.map((value) => [key(value), value]))
  const afterMap = new Map(after.map((value) => [key(value), value]))
  return {
    added: after.filter((value) => !beforeMap.has(key(value))),
    removed: before.filter((value) => !afterMap.has(key(value))),
    common: after.flatMap((value) => {
      const previous = beforeMap.get(key(value))
      return previous ? [[previous, value] as [T, T]] : []
    }),
  }
}

function addFact(target: SemanticFact[], input: FactInput): void {
  const details = input.details?.filter(Boolean).slice(0, MAX_DETAILS)
  const fact: SemanticFact = {
    id: stableId(`${input.code}|${input.operation}|${input.subject}|${input.path}|${details?.join('|') ?? ''}`),
    code: input.code,
    operation: input.operation,
    certainty: input.certainty ?? 'fact',
    level: input.level,
    confidence: Math.max(1, Math.min(100, Math.round(input.confidence))),
    subject: input.subject,
    ...(details?.length ? { details } : {}),
    evidence: [{
      path: input.path,
      ...(input.line ? { line: input.line } : {}),
      ...(input.symbol ? { symbol: input.symbol } : {}),
      ...(input.excerpt ? { excerpt: input.excerpt.slice(0, MAX_EXCERPT) } : {}),
    }],
  }

  const duplicate = target.find((existing) => existing.code === fact.code
    && existing.operation === fact.operation
    && existing.subject === fact.subject
    && existing.details?.join('|') === fact.details?.join('|'))
  if (duplicate) {
    if (!duplicate.evidence.some((evidence) => evidence.path === input.path && evidence.line === input.line)) {
      duplicate.evidence.push(fact.evidence[0])
    }
    duplicate.confidence = Math.max(duplicate.confidence, fact.confidence)
    return
  }
  target.push(fact)
}

function analyzeNamedBlocks(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const before = extractNamedBlocks(beforeContent, path)
  const after = extractNamedBlocks(afterContent, path)
  const diff = matchSetDiff(before, after, (item) => `${item.kind}:${item.name}`)

  for (const block of diff.added) {
    addFact(facts, { code: block.kind, operation: 'added', level: 'structural', confidence: 98, subject: block.name, path, line: block.line, symbol: block.name, excerpt: block.signature })
  }
  for (const block of diff.removed) {
    addFact(facts, { code: block.kind, operation: 'removed', level: 'structural', confidence: 98, subject: block.name, path, line: block.line, symbol: block.name, excerpt: block.signature })
  }
  for (const [previous, current] of diff.common) {
    if (previous.bodyHash !== current.bodyHash) {
      addFact(facts, { code: current.kind === 'component' ? 'component' : 'code_logic', operation: 'modified', level: current.kind === 'component' ? 'structural' : 'functional', confidence: 91, subject: current.name, path, line: current.line, symbol: current.name, excerpt: current.signature, details: [current.kind] })
    }
  }
}

function analyzeRouteDiff(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const beforeRoutes = uniqueByKey(extractRoutes(beforeContent), (route) => `${route.method}:${route.path}`)
  const afterRoutes = uniqueByKey(extractRoutes(afterContent), (route) => `${route.method}:${route.path}`)
  const diff = matchSetDiff(beforeRoutes, afterRoutes, (route) => `${route.method}:${route.path}`)
  for (const route of diff.added) addFact(facts, { code: 'route', operation: 'added', level: 'functional', confidence: 98, subject: `${route.method} ${route.path}`, path, line: route.line })
  for (const route of diff.removed) addFact(facts, { code: 'route', operation: 'removed', level: 'functional', confidence: 98, subject: `${route.method} ${route.path}`, path, line: route.line })
  for (const [previous, current] of diff.common) {
    if (previous.fingerprint !== current.fingerprint) addFact(facts, { code: 'route', operation: 'modified', level: 'functional', confidence: 88, subject: `${current.method} ${current.path}`, path, line: current.line })
  }

  const beforeRequests = uniqueByKey(extractApiRequests(beforeContent), (route) => `${route.method}:${route.path}`)
  const afterRequests = uniqueByKey(extractApiRequests(afterContent), (route) => `${route.method}:${route.path}`)
  const requestDiff = matchSetDiff(beforeRequests, afterRequests, (route) => `${route.method}:${route.path}`)
  for (const request of requestDiff.added) addFact(facts, { code: 'api_request', operation: 'added', level: 'functional', confidence: 96, subject: `${request.method} ${request.path}`, path, line: request.line })
  for (const request of requestDiff.removed) addFact(facts, { code: 'api_request', operation: 'removed', level: 'functional', confidence: 96, subject: `${request.method} ${request.path}`, path, line: request.line })
  for (const [previous, current] of requestDiff.common) {
    if (previous.fingerprint !== current.fingerprint) addFact(facts, { code: 'api_request', operation: 'modified', level: 'functional', confidence: 86, subject: `${current.method} ${current.path}`, path, line: current.line })
  }
}

function extractSqlItems(content: string): Array<{ code: SemanticFactCode; subject: string; line: number; excerpt: string }> {
  const patterns: Array<[SemanticFactCode, RegExp, (match: RegExpMatchArray) => string]> = [
    ['database_table', /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?[`"\[]?([\w.]+)/gi, (match) => match[1]],
    ['database_table', /\bdrop\s+table\s+(?:if\s+exists\s+)?[`"\[]?([\w.]+)/gi, (match) => match[1]],
    ['database_column', /\balter\s+table\s+[`"\[]?([\w.]+)[`"\]]?\s+(?:add(?:\s+column)?|drop(?:\s+column)?|modify(?:\s+column)?|alter(?:\s+column)?)\s+[`"\[]?([\w.]+)/gi, (match) => `${match[1]}.${match[2]}`],
    ['database_index', /\bcreate\s+(?:unique\s+)?index\s+[`"\[]?([\w.]+)/gi, (match) => match[1]],
    ['database_relation', /\bforeign\s+key\s*\(([^)]+)\)\s*references\s+[`"\[]?([\w.]+)/gi, (match) => `${match[1].trim()} → ${match[2]}`],
  ]
  const output: Array<{ code: SemanticFactCode; subject: string; line: number; excerpt: string }> = []
  for (const [code, pattern, subject] of patterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const index = match.index ?? 0
      output.push({ code, subject: subject(match), line: lineNumberAt(content, index), excerpt: excerptAt(content, index) })
    }
  }

  for (const match of content.matchAll(/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?[`"\[]?([\w.]+)[`"\]]?\s*\(/gi)) {
    const table = match[1]
    const opening = content.indexOf('(', (match.index ?? 0) + match[0].length - 1)
    if (opening === -1) continue
    let depth = 0
    let closing = opening
    for (let index = opening; index < content.length; index += 1) {
      if (content[index] === '(') depth += 1
      if (content[index] === ')') {
        depth -= 1
        if (depth === 0) { closing = index; break }
      }
    }
    const body = content.slice(opening + 1, closing)
    const bodyOffset = opening + 1
    for (const lineMatch of body.matchAll(/^\s*[`"\[]?([A-Za-z_][\w]*)[`"\]]?\s+([A-Za-z][\w]*(?:\s*\([^)]*\))?)/gm)) {
      const name = lineMatch[1]
      if (/^(?:primary|unique|constraint|foreign|index|key|check)$/i.test(name)) continue
      const index = bodyOffset + (lineMatch.index ?? 0)
      output.push({ code: 'database_column', subject: `${table}.${name}`, line: lineNumberAt(content, index), excerpt: excerptAt(content, index) })
    }
    for (const indexMatch of body.matchAll(/^\s*(?:unique\s+)?(?:key|index)\s+[`"\[]?([A-Za-z_][\w]*)/gmi)) {
      const index = bodyOffset + (indexMatch.index ?? 0)
      output.push({ code: 'database_index', subject: indexMatch[1], line: lineNumberAt(content, index), excerpt: excerptAt(content, index) })
    }
  }
  return output
}

function analyzeSql(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const before = extractSqlItems(beforeContent)
  const after = extractSqlItems(afterContent)
  const diff = matchSetDiff(before, after, (item) => `${item.code}:${item.subject}`)
  for (const item of diff.added) addFact(facts, { code: item.code, operation: 'added', level: item.code === 'database_table' ? 'functional' : 'structural', confidence: 98, subject: item.subject, path, line: item.line, excerpt: item.excerpt })
  for (const item of diff.removed) addFact(facts, { code: item.code, operation: 'removed', level: item.code === 'database_table' ? 'functional' : 'structural', confidence: 96, subject: item.subject, path, line: item.line, excerpt: item.excerpt })
}

function parseJsonObject(content: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(content)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}

function analyzeManifest(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const before = parseJsonObject(beforeContent)
  const after = parseJsonObject(afterContent)
  if (!after && !before) return

  const beforeDependencies = { ...stringRecord(before?.dependencies), ...stringRecord(before?.devDependencies), ...stringRecord(before?.peerDependencies) }
  const afterDependencies = { ...stringRecord(after?.dependencies), ...stringRecord(after?.devDependencies), ...stringRecord(after?.peerDependencies) }
  for (const [name, version] of Object.entries(afterDependencies)) {
    if (!(name in beforeDependencies)) addFact(facts, { code: 'dependency', operation: 'added', level: 'structural', confidence: 100, subject: name, details: [version], path })
    else if (beforeDependencies[name] !== version) addFact(facts, { code: 'dependency', operation: 'modified', level: 'structural', confidence: 100, subject: name, details: [beforeDependencies[name], version], path })
  }
  for (const [name, version] of Object.entries(beforeDependencies)) {
    if (!(name in afterDependencies)) addFact(facts, { code: 'dependency', operation: 'removed', level: 'structural', confidence: 100, subject: name, details: [version], path })
  }

  const beforeScripts = stringRecord(before?.scripts)
  const afterScripts = stringRecord(after?.scripts)
  for (const [name, command] of Object.entries(afterScripts)) {
    if (!(name in beforeScripts)) addFact(facts, { code: 'build_script', operation: 'added', level: 'structural', confidence: 100, subject: name, details: [command], path })
    else if (beforeScripts[name] !== command) addFact(facts, { code: 'build_script', operation: 'modified', level: 'structural', confidence: 100, subject: name, details: [beforeScripts[name], command], path })
  }
  for (const [name, command] of Object.entries(beforeScripts)) {
    if (!(name in afterScripts)) addFact(facts, { code: 'build_script', operation: 'removed', level: 'structural', confidence: 100, subject: name, details: [command], path })
  }
}

function extractTestCases(content: string, path: string): Array<{ name: string; line: number }> {
  const extension = extensionOf(path)
  const patterns: RegExp[] = [
    /\b(?:it|test|describe)\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /^\s*(?:async\s+)?def\s+(test_[A-Za-z_][\w]*)\s*\(/gm,
    /function\s+(test[A-Za-z_][\w]*)\s*\(/g,
    /\b(?:public\s+)?function\s+(test[A-Za-z_][\w]*)\s*\(/g,
    /\[(?:Fact|Test|TestMethod)\][\s\S]{0,160}?\b([A-Za-z_][\w]*)\s*\(/g,
  ]
  if (!/(?:test|spec|__tests__)/i.test(path) && !['js', 'ts', 'jsx', 'tsx', 'py', 'php', 'cs', 'java'].includes(extension)) return []
  const output: Array<{ name: string; line: number }> = []
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      output.push({ name: match[1], line: lineNumberAt(content, match.index ?? 0) })
    }
  }
  return uniqueByKey(output, (item) => item.name)
}

function analyzeTests(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const diff = matchSetDiff(extractTestCases(beforeContent, path), extractTestCases(afterContent, path), (item) => item.name)
  for (const item of diff.added) addFact(facts, { code: 'test_case', operation: 'added', level: 'structural', confidence: 98, subject: item.name, path, line: item.line })
  for (const item of diff.removed) addFact(facts, { code: 'test_case', operation: 'removed', level: 'structural', confidence: 98, subject: item.name, path, line: item.line })
}

function extractDocHeadings(content: string): Array<{ name: string; line: number }> {
  const output: Array<{ name: string; line: number }> = []
  for (const match of content.matchAll(/^#{1,6}\s+(.+)$/gm)) output.push({ name: match[1].trim(), line: lineNumberAt(content, match.index ?? 0) })
  return uniqueByKey(output, (item) => item.name.toLowerCase())
}

function analyzeDocumentation(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  if (!/\.(?:md|mdx|txt)$/i.test(path) && !/(?:readme|changelog|install|license)/i.test(path)) return
  const diff = matchSetDiff(extractDocHeadings(beforeContent), extractDocHeadings(afterContent), (item) => item.name.toLowerCase())
  for (const item of diff.added) addFact(facts, { code: 'documentation_section', operation: 'added', level: 'structural', confidence: 96, subject: item.name, path, line: item.line })
  for (const item of diff.removed) addFact(facts, { code: 'documentation_section', operation: 'removed', level: 'structural', confidence: 96, subject: item.name, path, line: item.line })
}

function extractForms(content: string): Array<{ subject: string; line: number; details: string[] }> {
  const output: Array<{ subject: string; line: number; details: string[] }> = []
  for (const match of content.matchAll(/<form\b([^>]*)>/gi)) {
    const attributes = match[1] ?? ''
    const action = attributes.match(/action\s*=\s*["']([^"']*)/i)?.[1] || 'current page'
    const method = attributes.match(/method\s*=\s*["']([^"']*)/i)?.[1]?.toUpperCase() || 'GET'
    output.push({ subject: `${method} ${action}`, line: lineNumberAt(content, match.index ?? 0), details: [method, action] })
  }
  return output
}

function extractInputs(content: string): Array<{ subject: string; line: number; details: string[] }> {
  const output: Array<{ subject: string; line: number; details: string[] }> = []
  for (const match of content.matchAll(/<(?:input|select|textarea)\b([^>]*)>/gi)) {
    const attributes = match[1] ?? ''
    const name = attributes.match(/name\s*=\s*["']([^"']+)/i)?.[1]
    if (!name) continue
    const type = attributes.match(/type\s*=\s*["']([^"']+)/i)?.[1] || match[0].match(/^<([a-z]+)/i)?.[1] || 'field'
    output.push({ subject: name, line: lineNumberAt(content, match.index ?? 0), details: [type] })
  }
  return uniqueByKey(output, (item) => item.subject)
}

function analyzeForms(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const formDiff = matchSetDiff(extractForms(beforeContent), extractForms(afterContent), (item) => item.subject)
  for (const item of formDiff.added) addFact(facts, { code: 'form', operation: 'added', level: 'functional', confidence: 96, subject: item.subject, details: item.details, path, line: item.line })
  for (const item of formDiff.removed) addFact(facts, { code: 'form', operation: 'removed', level: 'functional', confidence: 96, subject: item.subject, details: item.details, path, line: item.line })

  const inputDiff = matchSetDiff(extractInputs(beforeContent), extractInputs(afterContent), (item) => item.subject)
  if (inputDiff.added.length) addFact(facts, { code: 'input_field', operation: 'added', level: 'structural', confidence: 94, subject: 'form fields', details: inputDiff.added.map((item) => `${item.subject} (${item.details[0]})`), path, line: inputDiff.added[0].line })
  if (inputDiff.removed.length) addFact(facts, { code: 'input_field', operation: 'removed', level: 'structural', confidence: 94, subject: 'form fields', details: inputDiff.removed.map((item) => `${item.subject} (${item.details[0]})`), path, line: inputDiff.removed[0].line })
}

function featurePresence(rule: FeatureRule, content: string, path: string): { present: boolean; index: number; excerpt?: string; fingerprint?: string; viaPath?: boolean } {
  for (const pattern of rule.patterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(content)
    if (match) return { present: true, index: match.index, excerpt: excerptAt(content, match.index), fingerprint: shortHash(content.slice(Math.max(0, match.index - 120), Math.min(content.length, match.index + 520)).replace(/\s+/g, ' ')) }
  }
  const pathMatch = content.length > 0 && (rule.pathPatterns?.some((pattern) => pattern.test(path)) ?? false)
  return { present: pathMatch, index: 0, ...(pathMatch ? { excerpt: path, viaPath: true } : {}) }
}

function analyzeFeatureRules(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  for (const rule of FEATURE_RULES) {
    const before = featurePresence(rule, beforeContent, path)
    const after = featurePresence(rule, afterContent, path)
    if (!before.present && after.present) {
      addFact(facts, { code: rule.code, operation: 'added', level: rule.level, confidence: rule.confidence, subject: rule.subject, path, line: lineNumberAt(afterContent, after.index), excerpt: after.excerpt })
    } else if (before.present && !after.present) {
      addFact(facts, { code: rule.code, operation: 'removed', level: rule.level, confidence: Math.max(65, rule.confidence - 4), subject: rule.subject, path, line: lineNumberAt(beforeContent, before.index), excerpt: before.excerpt })
    } else if (before.present && after.present && !before.viaPath && !after.viaPath && before.fingerprint !== after.fingerprint) {
      addFact(facts, { code: rule.code, operation: 'modified', certainty: 'inference', level: rule.level, confidence: Math.max(62, rule.confidence - 12), subject: rule.subject, path, line: lineNumberAt(afterContent, after.index), excerpt: after.excerpt })
    }
  }
}

function analyzeEnvironmentVariables(path: string, beforeContent: string, afterContent: string, facts: SemanticFact[]): void {
  const extract = (content: string) => uniqueByKey([
    ...Array.from(content.matchAll(/(?:process\.env\.|import\.meta\.env\.|getenv\s*\(\s*["']|\$_ENV\s*\[\s*["'])([A-Z][A-Z0-9_]+)/g), (match) => ({ name: match[1], line: lineNumberAt(content, match.index ?? 0) })),
    ...Array.from(content.matchAll(/^([A-Z][A-Z0-9_]+)\s*=/gm), (match) => ({ name: match[1], line: lineNumberAt(content, match.index ?? 0) })),
  ], (item) => item.name)
  const diff = matchSetDiff(extract(beforeContent), extract(afterContent), (item) => item.name)
  for (const item of diff.added) addFact(facts, { code: 'environment_variable', operation: 'added', level: 'structural', confidence: 95, subject: item.name, path, line: item.line })
  for (const item of diff.removed) addFact(facts, { code: 'environment_variable', operation: 'removed', level: 'structural', confidence: 92, subject: item.name, path, line: item.line })
}

function analyzeFile(change: FileChange, from: Snapshot, to: Snapshot, facts: SemanticFact[]): { represented: boolean; language?: string } {
  const beforeFile = from.files[change.path]
  const afterFile = to.files[change.path]
  const beforeContent = beforeFile?.content ?? ''
  const afterContent = afterFile?.content ?? ''
  const language = languageOf(change.path)
  const startCount = facts.length

  analyzeNamedBlocks(change.path, beforeContent, afterContent, facts)
  analyzeRouteDiff(change.path, beforeContent, afterContent, facts)
  analyzeSql(change.path, beforeContent, afterContent, facts)
  analyzeForms(change.path, beforeContent, afterContent, facts)
  analyzeTests(change.path, beforeContent, afterContent, facts)
  analyzeDocumentation(change.path, beforeContent, afterContent, facts)
  analyzeFeatureRules(change.path, beforeContent, afterContent, facts)
  analyzeEnvironmentVariables(change.path, beforeContent, afterContent, facts)

  const extension = extensionOf(change.path)
  if (extension === 'php' && change.status !== 'modified' && !/(?:^|\/)(?:includes?|config|vendor|migrations?)(?:\/|$)/i.test(change.path)) {
    const webRoot = change.path.match(/(?:^|\/)www\/[^/]+\/(.+)$/i)?.[1] ?? change.path
    addFact(facts, {
      code: 'route',
      operation: change.status,
      certainty: 'inference',
      level: 'functional',
      confidence: 82,
      subject: `PAGE /${webRoot.replace(/index\.php$/i, '').replace(/\/$/, '') || ''}`,
      path: change.path,
    })
  }

  if (/\/(?:package|composer)\.json$/i.test(`/${change.path}`) || /(?:^|\/)package\.json$/i.test(change.path)) {
    analyzeManifest(change.path, beforeContent, afterContent, facts)
  }

  const represented = facts.length > startCount
  if (!represented) {
    const subject = language ? `${language} file ${change.path}` : change.path
    const certainty: SemanticCertainty = change.status === 'modified' ? 'inference' : 'fact'
    addFact(facts, {
      code: change.status === 'modified' ? 'code_logic' : 'file_content',
      operation: change.status,
      certainty,
      level: 'fallback',
      confidence: change.status === 'modified' ? 64 : 88,
      subject,
      path: change.path,
      details: [
        `${change.addedLines} lines added`,
        `${change.removedLines} lines removed`,
        language ?? 'unknown text format',
      ],
    })
  }

  return { represented: true, ...(language ? { language } : {}) }
}

function mergeFacts(inputFacts: SemanticFact[]): SemanticFact[] {
  const output: SemanticFact[] = []
  for (const fact of inputFacts) {
    const candidate = output.find((existing) => existing.code === fact.code
      && existing.operation === fact.operation
      && existing.subject === fact.subject
      && existing.details?.join('|') === fact.details?.join('|'))
    if (!candidate) {
      output.push({ ...fact, evidence: [...fact.evidence] })
      continue
    }
    for (const evidence of fact.evidence) {
      if (!candidate.evidence.some((item) => item.path === evidence.path && item.line === evidence.line)) candidate.evidence.push(evidence)
    }
    candidate.confidence = Math.max(candidate.confidence, fact.confidence)
  }
  return output.sort((left, right) => {
    const levelOrder: Record<SemanticLevel, number> = { functional: 0, structural: 1, fallback: 2 }
    return levelOrder[left.level] - levelOrder[right.level]
      || right.confidence - left.confidence
      || left.subject.localeCompare(right.subject)
  })
}

export function analyzeSemanticChanges(changes: FileChange[], from: Snapshot, to: Snapshot): SemanticAnalysis {
  const facts: SemanticFact[] = []
  const languages = new Set<string>()
  let candidateTextFiles = 0
  let analyzedTextFiles = 0
  let representedTextFiles = 0
  let fallbackTextFiles = 0
  let binaryFiles = 0

  for (const change of changes) {
    const beforeFile: SnapshotFile | undefined = from.files[change.path]
    const afterFile: SnapshotFile | undefined = to.files[change.path]
    if (change.binary || (beforeFile?.kind === 'binary' || afterFile?.kind === 'binary')) {
      binaryFiles += 1
      continue
    }
    candidateTextFiles += 1
    if (beforeFile?.content === undefined && afterFile?.content === undefined) continue
    analyzedTextFiles += 1
    const beforeCount = facts.length
    const result = analyzeFile(change, from, to, facts)
    if (result.language) languages.add(result.language)
    if (facts.length > beforeCount) representedTextFiles += 1
    if (facts.slice(beforeCount).some((fact) => fact.level === 'fallback')) fallbackTextFiles += 1
  }

  const merged = mergeFacts(facts)
  const truncatedFacts = Math.max(0, merged.length - MAX_FACTS)
  const selectedFacts = merged.slice(0, MAX_FACTS)
  const coveragePercent = candidateTextFiles === 0 ? 100 : Math.round((representedTextFiles / candidateTextFiles) * 100)
  const warnings: string[] = []
  if (fallbackTextFiles) warnings.push(`${fallbackTextFiles} text files required generic fallback descriptions.`)
  if (binaryFiles) warnings.push(`${binaryFiles} binary files were not semantically inspected.`)
  if (truncatedFacts) warnings.push(`${truncatedFacts} lower-priority semantic facts were omitted from the report.`)

  return {
    facts: selectedFacts,
    analyzedTextFiles,
    candidateTextFiles,
    representedTextFiles,
    fallbackTextFiles,
    binaryFiles,
    detectedLanguages: [...languages].sort(),
    coveragePercent,
    truncatedFacts,
    warnings,
  }
}
