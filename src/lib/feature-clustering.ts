import type {
  ChangeCategory,
  FeatureAreaCode,
  FeatureCluster,
  FeatureGroupCode,
  FeatureTag,
  FeatureTreeNode,
  FileChange,
  InferredCommit,
  ScopeAnalysis,
  SemanticAnalysis,
  SemanticFact,
  SemanticFactCode,
  SemanticLevel,
  SemanticOperation,
  Snapshot,
} from './types'
import { analyzeSemanticChanges } from './semantic.js'

interface AreaRule {
  area: FeatureAreaCode
  group: FeatureGroupCode
  sequence: number
  pathPatterns: RegExp[]
  contentPatterns?: RegExp[]
  factCodes?: SemanticFactCode[]
}

interface ScoredArea {
  area: FeatureAreaCode
  score: number
  signals: string[]
}

interface Assignment {
  area: FeatureAreaCode
  score: number
  confidence: number
  signals: string[]
  secondary: FeatureAreaCode[]
}

const AREA_LABELS_RU: Record<FeatureAreaCode, string> = {
  foundation: 'Основа приложения',
  public_site: 'Публичный сайт',
  lead_requests: 'Заявки и обращения',
  contracts: 'Электронные договоры',
  reviews: 'Отзывы',
  admin_core: 'Административная панель',
  students: 'Ученики и успеваемость',
  authentication: 'Авторизация и безопасность',
  personal_account: 'Личный кабинет',
  schedule: 'Расписание и календарь',
  homework: 'Домашние задания',
  payments: 'Оплаты и чеки',
  communications: 'Email и уведомления',
  settings: 'Настройки профиля',
  database: 'База данных',
  infrastructure: 'Инфраструктура и конфигурация',
  quality: 'Тесты и контроль качества',
  documentation: 'Документация',
  minor_fixes: 'Небольшие исправления',
  assets: 'Медиа и ресурсы',
  other: 'Прочие компоненты',
}

const GROUP_LABELS_RU: Record<FeatureGroupCode, string> = {
  product: 'Продуктовые возможности',
  access: 'Доступ и коммуникации',
  platform: 'Платформа и инфраструктура',
  quality: 'Качество и документация',
}

const AREA_RULES: AreaRule[] = [
  {
    area: 'lead_requests', group: 'product', sequence: 35,
    pathPatterns: [/(?:^|\/)(?:course[_-]?requests?|consultation[_-]?requests?|requests?)\.(?:php|ts|js|py)$/i, /submit[_-]?lead/i, /lead[_-]?(?:form|request|api)/i, /course[_-]?requests/i],
    contentPatterns: [/consultation_requests|course_requests|submit[-_ ]?lead|заявк[аи] на консультац/i],
  },
  {
    area: 'contracts', group: 'product', sequence: 45,
    pathPatterns: [/contract/i, /agreement/i, /public[_-]?offer/i, /personal[_-]?data[_-]?consent/i, /notifications?[_-]?consent/i, /refund[_-]?policy/i, /documents?[_-]?package/i],
    contentPatterns: [/contract_clients|contract_contact_changes|submit-contract|договор|оферт/i],
    factCodes: ['contract_section'],
  },
  {
    area: 'reviews', group: 'product', sequence: 55,
    pathPatterns: [/reviews?/i, /reorder[_-]?reviews?/i],
    contentPatterns: [/review-functions|update-review-visibility|отзыв/i],
  },
  {
    area: 'students', group: 'product', sequence: 75,
    pathPatterns: [/(?:^|\/)(?:students?|pupils?|learners?)(?:\.|\/|$)/i, /student[_-]?(?:grade|contact|card|list)/i, /grades?/i, /attendance/i],
    contentPatterns: [/student_id|update-grade|карточк[аи] ученика|успеваемост/i],
  },
  {
    area: 'authentication', group: 'access', sequence: 80,
    pathPatterns: [/(?:^|\/)auth(?:\/|$)/i, /login/i, /logout/i, /forgot/i, /reset/i, /verify/i, /admin-auth/i, /session/i, /csrf/i],
    contentPatterns: [/password_hash|password_verify|one[-_ ]?time|одноразов|csrf|session_set_cookie_params|require_user/i],
    factCodes: ['authentication', 'logout', 'one_time_code', 'password_security', 'csrf_protection', 'session_security', 'authorization'],
  },
  {
    area: 'personal_account', group: 'product', sequence: 90,
    pathPatterns: [/(?:^|\/)lk\.[^/]+\//i, /personal[_-]?account/i, /student[_-]?cabinet/i, /cabinet/i, /dashboard/i],
    contentPatterns: [/личн(?:ый|ого) кабинет|personal account|student cabinet/i],
    factCodes: ['user_cabinet', 'shared_navigation'],
  },
  {
    area: 'schedule', group: 'product', sequence: 100,
    pathPatterns: [/schedule/i, /calendar/i, /timetable/i, /lesson[_-]?reminders?/i, /schedule[_-]?status/i],
    contentPatterns: [/lesson_schedule|data-calendar|расписан|календар/i],
    factCodes: ['schedule_section'],
  },
  {
    area: 'homework', group: 'product', sequence: 110,
    pathPatterns: [/homework/i, /assignments?/i, /submissions?/i, /learning[_-]?classroom/i, /download[_-]?homework/i],
    contentPatterns: [/homework_assignments|homework_submissions|homework_files|домашн(?:ее|яя) задани/i],
    factCodes: ['homework_section'],
  },
  {
    area: 'payments', group: 'product', sequence: 120,
    pathPatterns: [/payments?/i, /receipts?/i, /billing/i, /invoices?/i, /checks?/i],
    contentPatterns: [/оплат|чек|receipt|payment/i],
    factCodes: ['payments_section'],
  },
  {
    area: 'communications', group: 'access', sequence: 130,
    pathPatterns: [/email/i, /smtp/i, /imap/i, /messages?/i, /threads?/i, /notifications?/i, /reminders?/i],
    contentPatterns: [/smtp_send|stream_socket_client|mail\s*\(|email_notifications|student_email/i],
    factCodes: ['email_delivery', 'background_worker', 'realtime_connection'],
  },
  {
    area: 'settings', group: 'product', sequence: 140,
    pathPatterns: [/(?:^|\/)settings?(?:\/|\.|$)/i, /profile/i, /preferences?/i],
    contentPatterns: [/изменить пароль|настройк[аи] профиля|profile settings/i],
    factCodes: ['profile_settings'],
  },
  {
    area: 'admin_core', group: 'platform', sequence: 65,
    pathPatterns: [/(?:^|\/)admin\.[^/]+\//i, /(?:^|\/)admin(?:\/|$)/i, /admin[_-]?(?:nav|theme|i18n|reminders|assets)/i, /_header\.php$/i, /backoffice/i],
    contentPatterns: [/administrative|административн|admin panel/i],
  },
  {
    area: 'database', group: 'platform', sequence: 20,
    pathPatterns: [/(?:^|\/)database(?:\/|$)/i, /migrations?(?:\/|$)/i, /schema/i, /\.sql$/i, /database\.(?:php|ts|js|py)$/i],
    contentPatterns: [/create\s+table|alter\s+table|foreign\s+key/i],
    factCodes: ['database_table', 'database_column', 'database_index', 'database_relation'],
  },
  {
    area: 'public_site', group: 'product', sequence: 30,
    pathPatterns: [/(?:^|\/)(?:index|documents|test)\.html?$/i, /assets\/(?:css|js|img)\//i, /site\.css$/i, /assets\/js\/app\.js$/i, /landing/i, /cefr/i, /test-game/i],
    contentPatterns: [/<main|<header|<section|hero|landing page/i],
    factCodes: ['responsive_layout', 'animation', 'layout_system', 'localization'],
  },
  {
    area: 'foundation', group: 'platform', sequence: 10,
    pathPatterns: [/(?:^|\/)(?:includes?|lib|core|common|utils?|services?)(?:\/|$)/i, /bootstrap/i, /functions?\.(?:php|ts|js|py)$/i],
    contentPatterns: [/function\s+|class\s+|export\s+(?:function|class)/i],
  },
  {
    area: 'infrastructure', group: 'platform', sequence: 150,
    pathPatterns: [/(?:^|\/)config(?:\/|$)/i, /\.htaccess$/i, /(?:^|\/)cron(?:\/|$)/i, /docker/i, /\.github\//i, /package(?:-lock)?\.json$/i, /composer\.(?:json|lock)$/i, /requirements\.txt$/i, /tsconfig/i, /vite\.config/i, /setup\.(?:php|sh|ps1)$/i, /\.env/i],
    contentPatterns: [/environment|configuration|rewriteengine|cron/i],
    factCodes: ['configuration', 'ci_pipeline', 'containerization', 'access_rule', 'environment_variable', 'dependency', 'build_script', 'installation_setup'],
  },
  {
    area: 'quality', group: 'quality', sequence: 160,
    pathPatterns: [/(?:^|\/)tests?(?:\/|$)/i, /\.spec\./i, /\.test\./i, /__tests__/i, /playwright|cypress|vitest|jest/i],
    factCodes: ['test_case'],
  },
  {
    area: 'documentation', group: 'quality', sequence: 170,
    pathPatterns: [/readme/i, /changelog/i, /roadmap/i, /(?:^|\/)docs?(?:\/|$)/i, /\.md$/i, /license/i],
    factCodes: ['documentation_section'],
  },
  {
    area: 'minor_fixes', group: 'quality', sequence: 165,
    pathPatterns: [],
  },
  {
    area: 'assets', group: 'platform', sequence: 180,
    pathPatterns: [/(?:^|\/)assets?(?:\/|$)/i, /(?:^|\/)uploads?(?:\/|$)/i, /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|webm|pdf|docx|zip)$/i],
  },
  {
    area: 'other', group: 'quality', sequence: 999,
    pathPatterns: [],
  },
]

const RULE_BY_AREA = new Map(AREA_RULES.map((rule) => [rule.area, rule]))

const CATEGORY_FALLBACK: Record<ChangeCategory, FeatureAreaCode> = {
  auth: 'authentication', database: 'database', admin: 'admin_core', api: 'foundation', ui: 'public_site',
  styles: 'public_site', tests: 'quality', docs: 'documentation', config: 'infrastructure', deps: 'infrastructure',
  assets: 'assets', other: 'other',
}

const FACT_AREA_HINTS: Partial<Record<SemanticFactCode, FeatureAreaCode>> = {
  user_cabinet: 'personal_account', contract_section: 'contracts', schedule_section: 'schedule', payments_section: 'payments',
  homework_section: 'homework', profile_settings: 'settings', authentication: 'authentication', logout: 'authentication',
  one_time_code: 'authentication', password_security: 'authentication', csrf_protection: 'authentication',
  session_security: 'authentication', authorization: 'authentication', email_delivery: 'communications',
  database_table: 'database', database_column: 'database', database_index: 'database', database_relation: 'database',
  dependency: 'infrastructure', build_script: 'infrastructure', environment_variable: 'infrastructure',
  test_case: 'quality', documentation_section: 'documentation', ci_pipeline: 'infrastructure',
  containerization: 'infrastructure', access_rule: 'infrastructure', installation_setup: 'infrastructure',
}

const FEATURE_CODE_BY_AREA: Record<FeatureAreaCode, SemanticFactCode> = {
  foundation: 'code_logic', public_site: 'layout_system', lead_requests: 'form', contracts: 'contract_section',
  reviews: 'code_logic', admin_core: 'code_logic', students: 'code_logic', authentication: 'authentication',
  personal_account: 'user_cabinet', schedule: 'schedule_section', homework: 'homework_section', payments: 'payments_section',
  communications: 'email_delivery', settings: 'profile_settings', database: 'database_table', infrastructure: 'configuration',
  quality: 'test_case', documentation: 'documentation_section', minor_fixes: 'code_logic', assets: 'file_content', other: 'code_logic',
}

function stableId(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

function activeContent(change: FileChange, from: Snapshot, to: Snapshot): string {
  return (to.files[change.path]?.content ?? from.files[change.path]?.content ?? '').slice(0, 180_000)
}

function patternScore(patterns: RegExp[] | undefined, value: string, weight: number): { score: number; signals: string[] } {
  if (!patterns?.length || !value) return { score: 0, signals: [] }
  let score = 0
  const signals: string[] = []
  for (const pattern of patterns) {
    if (!pattern.test(value)) continue
    score += weight
    signals.push(pattern.source.replaceAll('\\', '').slice(0, 48))
  }
  return { score: Math.min(score, weight * 3), signals }
}

function explicitAreaFromPath(path: string): FeatureAreaCode | undefined {
  const value = path.toLowerCase()
  const hints: Array<[FeatureAreaCode, RegExp]> = [
    ['contracts', /contract|agreement|public[_-]?offer|consent|refund[_-]?policy/],
    ['reviews', /review/],
    ['homework', /homework|assignment|submission/],
    ['schedule', /schedule|calendar|timetable/],
    ['payments', /payment|receipt|invoice|billing/],
    ['authentication', /(?:^|\/)(?:auth)(?:\/|$)|login|logout|forgot|reset|verify|admin-auth|session/],
    ['communications', /email|smtp|imap|message|notification/],
    ['lead_requests', /(?:^|\/)requests?(?:\.|\/|$)|submit[_-]?lead|course[_-]?request|consultation[_-]?request/],
    ['students', /(?:^|\/)students?(?:\.|\/|$)|student[_-]?(?:grade|contact)|grade|attendance/],
    ['settings', /(?:^|\/)settings?(?:\/|\.|$)|profile|preferences/],
  ]
  return hints.find(([, pattern]) => pattern.test(value))?.[0]
}

function scoreText(path: string, content: string, category?: ChangeCategory, factCodes: SemanticFactCode[] = []): ScoredArea[] {
  const normalizedPath = path.toLowerCase()
  const normalizedContent = content.toLowerCase()
  const explicitPathArea = explicitAreaFromPath(normalizedPath)
  const output: ScoredArea[] = []

  for (const rule of AREA_RULES) {
    if (rule.area === 'other') continue
    const pathResult = patternScore(rule.pathPatterns, normalizedPath, 14)
    const contentResult = patternScore(rule.contentPatterns, normalizedContent, 4)
    const factMatches = rule.factCodes?.filter((code) => factCodes.includes(code)).length ?? 0
    let score = pathResult.score + contentResult.score + factMatches * 11
    if (explicitPathArea === rule.area) score += 18
    if (category && CATEGORY_FALLBACK[category] === rule.area) score += 3

    // Broad containers must not beat an explicit product feature path.
    if (rule.area === 'admin_core' && /(?:contract|review|student|schedule|homework|assignment|email|payment)/i.test(normalizedPath)) score = Math.max(0, score - 12)
    if (rule.area === 'personal_account' && /\/(?:auth|schedule|homework|payments|settings)\//i.test(normalizedPath)) score = Math.max(0, score - 12)
    if (rule.area === 'database' && /(?:contract|review|homework|schedule|student|email|payment)/i.test(normalizedPath)) score = Math.max(0, score - 22)
    if (rule.area === 'public_site' && /(?:contract|review|homework|student|schedule|payment|auth)/i.test(normalizedPath)) score = Math.max(0, score - 14)
    if (rule.area === 'students' && /(?:^|\/)uploads?\/homework\//i.test(normalizedPath)) score = Math.max(0, score - 10)
    if (rule.area === 'assets' && /(?:contract|agreement|review|homework|student|schedule|payment|auth)/i.test(normalizedPath)) score = Math.max(0, score - 22)
    if (rule.area === 'foundation' && /(?:contract|review|homework|assignment|schedule|calendar|student|grade|email|payment|auth|login|logout|request)/i.test(normalizedPath)) score = Math.max(0, score - 26)
    if (rule.area === 'infrastructure' && /(?:contract|review|homework|schedule|student|email|payment|auth)/i.test(normalizedPath)) score = Math.max(0, score - 12)

    if (score > 0) output.push({ area: rule.area, score, signals: [...pathResult.signals, ...contentResult.signals] })
  }

  if (!output.length) {
    const fallback = category ? CATEGORY_FALLBACK[category] : 'other'
    output.push({ area: fallback, score: fallback === 'other' ? 2 : 5, signals: [`category:${category ?? 'unknown'}`] })
  }
  return output.sort((left, right) => right.score - left.score || RULE_BY_AREA.get(left.area)!.sequence - RULE_BY_AREA.get(right.area)!.sequence)
}

function assignmentForChange(change: FileChange, from: Snapshot, to: Snapshot, factsByPath: Map<string, SemanticFact[]>): Assignment {
  const fileFacts = factsByPath.get(change.path) ?? []
  const scored = scoreText(change.path, activeContent(change, from, to), change.category, fileFacts.map((fact) => fact.code))
  const best = scored[0]
  const second = scored[1]?.score ?? 0
  const margin = Math.max(0, best.score - second)
  const confidence = Math.max(52, Math.min(97, Math.round(56 + best.score * 0.9 + margin * 0.7)))
  const secondary = scored
    .slice(1)
    .filter((item) => item.score >= Math.max(8, best.score * 0.58))
    .slice(0, 4)
    .map((item) => item.area)
  return { area: best.area, score: best.score, confidence, signals: best.signals.slice(0, 5), secondary }
}

function explicitAreaFromSubject(subject: string): FeatureAreaCode | undefined {
  const value = subject.toLowerCase()
  const hints: Array<[FeatureAreaCode, RegExp]> = [
    ['foundation', /dev_environment|dev_database|database_(?:pdo|identifier)|ensure_dev_database|is_dev_admin_request/],
    ['contracts', /contract|agreement/], ['reviews', /review/], ['homework', /homework|assignment|submission|learning_stream/],
    ['schedule', /schedule|lesson/], ['communications', /smtp|email|message|notification/], ['students', /student|grade|attendance/],
    ['payments', /payment|receipt|invoice/], ['lead_requests', /course_request|consultation|lead/], ['authentication', /auth|password|session|token|verification|otp|code/],
  ]
  return hints.find(([, pattern]) => pattern.test(value))?.[0]
}

function isDocumentationPath(path: string): boolean {
  const normalized = path.toLowerCase()
  const fileName = normalized.split('/').at(-1) ?? normalized
  const namedDocument = /(?:^|[._-])(?:readme|changelog|roadmap|license|agents?|contributing|security)(?:[._-]|$)/i.test(fileName)
  const documentationExtension = /\.(?:md|mdx|rst|adoc)$/i.test(fileName)
  const namedTextDocument = namedDocument && (documentationExtension || /\.(?:txt|text)$/i.test(fileName) || !fileName.includes('.'))
  return /(?:^|\/)docs?(?:\/|$)/i.test(normalized)
    || documentationExtension
    || namedTextDocument
}

function dominantOperation(changes: FileChange[]): FileChange['status'] {
  const counts: Record<FileChange['status'], number> = { added: 0, modified: 0, removed: 0 }
  for (const change of changes) counts[change.status] += 1
  const active = (Object.entries(counts) as Array<[FileChange['status'], number]>).filter(([, count]) => count > 0)
  if (active.length > 1) return 'modified'
  return active[0]?.[0] ?? 'modified'
}

function titleForArea(area: FeatureAreaCode, operation: FileChange['status']): string {
  const added: Record<FeatureAreaCode, string> = {
    foundation: 'Сформирована основа приложения', public_site: 'Разработан публичный сайт', lead_requests: 'Добавлена система заявок',
    contracts: 'Добавлены электронные договоры', reviews: 'Добавлено управление отзывами', admin_core: 'Развита административная панель',
    students: 'Добавлено управление учениками', authentication: 'Добавлена авторизация и защита доступа',
    personal_account: 'Добавлен личный кабинет ученика', schedule: 'Добавлены расписание и календарь',
    homework: 'Добавлена система домашних заданий', payments: 'Добавлен раздел оплат и чеков',
    communications: 'Добавлены email-уведомления и сообщения', settings: 'Добавлены настройки профиля',
    database: 'Расширена структура базы данных', infrastructure: 'Настроена инфраструктура проекта',
    quality: 'Добавлены проверки и тесты', documentation: 'Подготовлена документация', minor_fixes: 'Исправлены небольшие изменения',
    assets: 'Добавлены медиа-ресурсы', other: 'Добавлены прочие компоненты',
  }
  if (operation === 'added') return added[area]
  if (operation === 'removed') return `Удалён функциональный блок «${AREA_LABELS_RU[area]}»`
  return `Обновлён функциональный блок «${AREA_LABELS_RU[area]}»`
}

function categoryRanking(changes: FileChange[]): ChangeCategory[] {
  const counts = new Map<ChangeCategory, number>()
  for (const change of changes) counts.set(change.category, (counts.get(change.category) ?? 0) + 1)
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([category]) => category)
}

function detectFeatureTags(area: FeatureAreaCode, facts: SemanticFact[]): FeatureTag[] {
  const tags: FeatureTag[] = []
  if (area === 'personal_account') tags.push('student_cabinet')
  if (area === 'authentication' && facts.some((fact) => fact.code === 'one_time_code')) tags.push('email_code_auth')
  if (area === 'authentication' && facts.some((fact) => fact.code === 'password_security')) tags.push('password_auth')
  if (area === 'authentication' && facts.some((fact) => /reset|forgot/i.test(fact.subject) || fact.evidence.some((item) => /reset|forgot/i.test(item.path)))) tags.push('password_reset')
  if (area === 'authentication') tags.push('session_security')
  if (area === 'contracts') tags.push('contract_access')
  if (area === 'schedule') tags.push('schedule_calendar')
  if (area === 'payments') tags.push('payments_section')
  if (area === 'homework') tags.push('homework_section')
  if (area === 'settings') tags.push('settings_profile')
  if (area === 'database') tags.push('database_schema')
  if (area === 'personal_account' || area === 'admin_core') tags.push('shared_layout')
  if (facts.some((fact) => fact.code === 'responsive_layout')) tags.push('mobile_navigation')
  if (area === 'communications' && facts.some((fact) => fact.code === 'email_delivery')) tags.push('smtp_delivery')
  if (area === 'documentation' || facts.some((fact) => fact.code === 'installation_setup')) tags.push('installation_docs')
  return [...new Set(tags)]
}

function cloneFactForArea(fact: SemanticFact, area: FeatureAreaCode, evidence: SemanticFact['evidence']): SemanticFact {
  return {
    ...fact,
    id: `${fact.id}-${area}-${stableId(evidence.map((item) => `${item.path}:${item.line ?? 0}`).join('|'))}`,
    evidence,
  }
}

function partitionFactsByArea(
  facts: SemanticFact[],
  assignments: Map<string, Assignment>,
  redirectedAreas: Map<FeatureAreaCode, FeatureAreaCode>,
): Map<FeatureAreaCode, SemanticFact[]> {
  const output = new Map<FeatureAreaCode, SemanticFact[]>()
  const add = (area: FeatureAreaCode, fact: SemanticFact, evidence: SemanticFact['evidence']) => {
    if (!evidence.length) return
    const finalArea = redirectedAreas.get(area) ?? area
    const items = output.get(finalArea) ?? []
    items.push(cloneFactForArea(fact, finalArea, evidence))
    output.set(finalArea, items)
  }

  for (const fact of facts) {
    const documentationEvidence = fact.evidence.filter((item) => isDocumentationPath(item.path))
    let sourceEvidence = fact.evidence.filter((item) => !isDocumentationPath(item.path))
    if (documentationEvidence.length) {
      add('documentation', fact, documentationEvidence)
      if (!sourceEvidence.length) continue
    }

    const explicitArea = explicitAreaFromSubject(fact.subject)
    const subjectRoutable = fact.code.startsWith('database_')
      || ['function', 'class', 'interface', 'type_definition', 'component', 'environment_variable', 'test_case'].includes(fact.code)
    if (explicitArea && subjectRoutable) {
      add(explicitArea, fact, sourceEvidence)
      continue
    }

    if (NOISY_SHARED_UTILITY_CODES.has(fact.code)) {
      sourceEvidence = sourceEvidence.filter((item) => !isSharedUtilityPath(item.path))
      if (!sourceEvidence.length) continue
    }

    const grouped = new Map<FeatureAreaCode, SemanticFact['evidence']>()
    for (const evidence of sourceEvidence) {
      const area = assignments.get(evidence.path)?.area
        ?? FACT_AREA_HINTS[fact.code]
        ?? 'other'
      const items = grouped.get(area) ?? []
      items.push(evidence)
      grouped.set(area, items)
    }
    for (const [area, evidence] of grouped) add(area, fact, evidence)
  }
  return output
}

function normalizeFactSubject(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function resolveFactConflicts(facts: SemanticFact[]): SemanticFact[] {
  const groups = new Map<string, SemanticFact[]>()
  for (const fact of facts) {
    const key = `${fact.code}|${normalizeFactSubject(fact.subject)}`
    const items = groups.get(key) ?? []
    items.push(fact)
    groups.set(key, items)
  }

  const output: SemanticFact[] = []
  for (const [key, items] of groups) {
    const operations = new Set(items.map((item) => item.operation))
    if (operations.size <= 1) {
      const first = items[0]
      const evidence = items.flatMap((item) => item.evidence)
        .filter((item, index, all) => all.findIndex((other) => other.path === item.path && other.line === item.line) === index)
      const details = [...new Set(items.flatMap((item) => item.details ?? []))].slice(0, 12)
      output.push({
        ...first,
        confidence: Math.max(...items.map((item) => item.confidence)),
        evidence,
        ...(details.length ? { details } : {}),
      })
      continue
    }

    const first = items.sort((left, right) => right.confidence - left.confidence)[0]
    const evidence = items.flatMap((item) => item.evidence)
      .filter((item, index, all) => all.findIndex((other) => other.path === item.path && other.line === item.line) === index)
    const details = [...new Set(items.flatMap((item) => item.details ?? []))].slice(0, 12)
    output.push({
      ...first,
      id: `resolved-${stableId(key)}`,
      operation: 'modified',
      certainty: items.every((item) => item.certainty === 'fact') ? 'fact' : 'inference',
      confidence: Math.max(65, Math.min(94, Math.max(...items.map((item) => item.confidence)) - 3)),
      evidence,
      ...(details.length ? { details } : {}),
    })
  }
  return output
}

const TECHNICAL_FUNCTIONAL_CODES = new Set<SemanticFactCode>([
  'route', 'api_request', 'form', 'json_api', 'redirect_navigation',
])

const NOISY_SHARED_UTILITY_CODES = new Set<SemanticFactCode>([
  'user_cabinet', 'contract_section', 'schedule_section', 'payments_section', 'homework_section', 'profile_settings',
  'shared_navigation', 'search', 'filtering', 'sorting', 'pagination', 'modal_dialog', 'responsive_layout',
  'animation', 'layout_system', 'localization', 'browser_storage', 'caching', 'drag_and_drop',
])

function isSharedUtilityPath(path: string): boolean {
  return /(?:^|\/)(?:includes?|lib|utils?|helpers?)(?:\/|$).*?(?:functions?|bootstrap|helpers?|utils?)\.(?:php|js|ts)$/i.test(path)
    || /(?:^|\/)[^/]*functions?\.php$/i.test(path)
}

const HIGH_VALUE_CODES = new Set<SemanticFactCode>([
  'database_table', 'database_column', 'database_index', 'database_relation', 'input_field',
  'one_time_code', 'password_security', 'csrf_protection', 'session_security', 'authorization',
  'file_upload', 'file_download', 'email_delivery', 'test_case', 'environment_variable',
])

const EXACT_STRUCTURAL_CODES = new Set<SemanticFactCode>([
  'function', 'class', 'interface', 'type_definition', 'component',
  'database_table', 'database_column', 'database_index', 'database_relation', 'input_field',
  'dependency', 'build_script', 'environment_variable', 'test_case',
])

function isSignificantCluster(area: FeatureAreaCode, changes: FileChange[], facts: SemanticFact[]): boolean {
  if (area === 'minor_fixes') return true
  const lineDelta = changes.reduce((sum, change) => sum + change.addedLines + change.removedLines, 0)
  const addedOrRemovedFiles = changes.filter((change) => change.status !== 'modified').length
  const meaningfulFunctional = facts.filter((fact) => fact.level === 'functional'
    && !TECHNICAL_FUNCTIONAL_CODES.has(fact.code)
    && fact.confidence >= 78).length
  const highValueFacts = facts.filter((fact) => HIGH_VALUE_CODES.has(fact.code) && fact.confidence >= 82).length
  const exactStructural = facts.filter((fact) => EXACT_STRUCTURAL_CODES.has(fact.code) && fact.confidence >= 90).length

  if (area === 'documentation') return addedOrRemovedFiles > 0 || changes.length >= 2 || lineDelta >= 12
  if (addedOrRemovedFiles > 0) return true
  if (highValueFacts > 0) return true
  if (exactStructural >= 2) return true
  if (meaningfulFunctional >= 2 && lineDelta >= 12) return true
  if (lineDelta >= 40) return true
  if (changes.length >= 3 && lineDelta >= 20) return true
  return false
}

function semanticOperation(changes: FileChange[], facts: SemanticFact[]): SemanticOperation {
  const meaningful = facts.filter((fact) => !TECHNICAL_FUNCTIONAL_CODES.has(fact.code) && fact.level !== 'fallback')
  const added = meaningful.filter((fact) => fact.operation === 'added').length
  const removed = meaningful.filter((fact) => fact.operation === 'removed').length
  if (added > 0 && removed === 0) return 'added'
  if (removed > 0 && added === 0) return 'removed'
  return dominantOperation(changes)
}

interface ClusterCapability {
  title: string
  subject: string
  operation: SemanticOperation
}

function hasFact(facts: SemanticFact[], pattern: RegExp, codes?: SemanticFactCode[]): boolean {
  return facts.some((fact) => (!codes || codes.includes(fact.code))
    && (pattern.test(fact.subject) || fact.details?.some((detail) => pattern.test(detail)) || fact.evidence.some((item) => pattern.test(item.path))))
}

function hasPath(changes: FileChange[], pattern: RegExp): boolean {
  return changes.some((change) => pattern.test(change.path))
}

function clusterCapability(
  area: FeatureAreaCode,
  changes: FileChange[],
  facts: SemanticFact[],
  relatedAreas: FeatureAreaCode[],
): ClusterCapability {
  const operation = semanticOperation(changes, facts)
  if (area === 'foundation' && hasFact(facts, /dev_environment_meta|ensure_dev_database|dev_database_ready|database_pdo/i)) {
    return { title: 'Добавлена поддержка отдельной базы данных для dev-окружения', subject: 'поддержка отдельной базы данных для dev-окружения', operation: 'added' }
  }
  if (area === 'contracts') {
    const history = hasFact(facts, /contract_contact_changes/i)
    const phone = hasFact(facts, /phone_display|detectPhoneCountry|formatNationalPhone|renderPhoneCountries|syncPhone/i)
    if (history && phone) return { title: 'Добавлена история изменений контактов и расширена форма телефона в договоре', subject: 'история изменений контактов и международный формат телефона в договоре', operation: 'added' }
    if (history) return { title: 'Добавлена история изменений контактных данных договора', subject: 'история изменений контактных данных договора', operation: 'added' }
    if (phone) return { title: 'Расширена форма телефона в электронном договоре', subject: 'международный формат телефона в электронном договоре', operation: 'added' }
  }
  if (area === 'students') {
    const contacts = hasPath(changes, /update-student-contact/i) || hasFact(facts, /phone|email|contact/i)
    const grades = hasPath(changes, /student-grade-chart/i) || hasFact(facts, /movingAverage|renderRangeCalendar|grade/i)
    if (contacts && grades) return { title: 'Добавлены редактирование контактов и график успеваемости ученика', subject: 'редактирование контактов и график успеваемости ученика', operation: 'added' }
    if (contacts) return { title: 'Добавлено редактирование контактных данных ученика', subject: 'редактирование контактных данных ученика', operation: 'added' }
    if (grades) return { title: 'Добавлен график успеваемости ученика', subject: 'график успеваемости ученика', operation: 'added' }
  }
  if (area === 'admin_core' && (hasFact(facts, /loadCalendar|calendar/i) || hasPath(changes, /admin\.js|admin-theme/i))) {
    return { title: 'Обновлены календарь и интерфейс административной панели', subject: 'календарь и интерфейс административной панели', operation: 'modified' }
  }
  if (area === 'personal_account' && hasFact(facts, /DashboardCalendar|dashboardDateKey|openDashboardPopover|LessonPopover/i)) {
    return { title: 'Обновлён календарь личного кабинета', subject: 'календарь личного кабинета', operation: 'modified' }
  }
  if (area === 'schedule' && hasPath(changes, /save-student-schedule\.php/i)) {
    return { title: 'Добавлено создание расписания из карточки ученика', subject: 'создание расписания из карточки ученика', operation: 'added' }
  }
  if (area === 'homework' && changes.every((change) => change.status === 'modified')) {
    return { title: 'Уточнена работа с домашними заданиями', subject: 'работа с домашними заданиями', operation: 'modified' }
  }
  if (area === 'minor_fixes') {
    const shortLabels: Partial<Record<FeatureAreaCode, string>> = {
      lead_requests: 'заявок', reviews: 'отзывов', authentication: 'авторизации', public_site: 'публичного сайта',
      admin_core: 'административной панели', students: 'учеников', schedule: 'расписания', homework: 'домашних заданий',
      contracts: 'договоров', personal_account: 'личного кабинета', infrastructure: 'конфигурации', other: 'проекта',
    }
    const labels = relatedAreas.map((item) => shortLabels[item]).filter((item): item is string => Boolean(item))
    const subject = labels.length ? `небольшие изменения в разделах ${labels.join(', ')}` : 'небольшие изменения проекта'
    return { title: `Исправлены ${subject}`, subject, operation: 'modified' }
  }
  if (area === 'documentation') {
    if (changes.every((change) => change.status === 'removed')) {
      return { title: 'Удалены служебные файлы документации проекта', subject: 'служебные файлы документации проекта', operation: 'removed' }
    }
    return { title: 'Обновлена служебная документация проекта', subject: 'служебная документация проекта', operation }
  }
  return { title: titleForArea(area, operation), subject: AREA_LABELS_RU[area], operation }
}

function synthesizeSummaryFact(capability: ClusterCapability, area: FeatureAreaCode, changes: FileChange[], confidence: number): SemanticFact {
  const evidence = changes.slice(0, 8).map((change) => ({ path: change.path }))
  return {
    id: `cluster-${stableId(`${area}:${capability.operation}:${changes.map((change) => change.path).join('|')}`)}`,
    code: FEATURE_CODE_BY_AREA[area],
    operation: capability.operation,
    certainty: 'inference',
    level: 'functional',
    confidence: Math.max(62, Math.min(94, confidence - 2)),
    subject: capability.subject,
    evidence,
  }
}

function summarizeFactGroup(facts: SemanticFact[], area: FeatureAreaCode, code: SemanticFactCode, level: SemanticLevel, label: string): SemanticFact {
  const operation = facts.some((fact) => fact.operation === 'modified') ? 'modified' : facts[0]?.operation ?? 'modified'
  const details = facts.map((fact) => fact.subject).filter(Boolean).slice(0, 12)
  const evidence = facts.flatMap((fact) => fact.evidence).filter((item, index, all) => all.findIndex((other) => other.path === item.path && other.line === item.line) === index).slice(0, 12)
  return {
    id: `summary-${stableId(`${area}:${code}:${operation}:${details.join('|')}`)}`,
    code,
    operation,
    certainty: facts.some((fact) => fact.certainty === 'fact') ? 'fact' : 'inference',
    level,
    confidence: Math.round(facts.reduce((sum, fact) => sum + fact.confidence, 0) / Math.max(facts.length, 1)),
    subject: `${AREA_LABELS_RU[area]}: ${label}`,
    details: [...details, `всего: ${facts.length}`].slice(0, 13),
    evidence,
  }
}

function compressFacts(
  area: FeatureAreaCode,
  facts: SemanticFact[],
  changes: FileChange[],
  clusterConfidence: number,
  capability: ClusterCapability,
): { facts: SemanticFact[]; omitted: number } {
  const resolved = resolveFactConflicts(facts)
  const scopedFacts = area === 'documentation'
    ? resolved.filter((fact) => fact.level === 'fallback' || ['documentation_section', 'installation_setup', 'file_content'].includes(fact.code))
    : area === 'minor_fixes'
      ? resolved.filter((fact) => fact.level === 'fallback' || fact.level === 'structural' || TECHNICAL_FUNCTIONAL_CODES.has(fact.code))
      : resolved.filter((fact) => !isDocumentationPath(fact.evidence[0]?.path ?? ''))
  const output: SemanticFact[] = [synthesizeSummaryFact(capability, area, changes, clusterConfidence)]
  const consumed = new Set<string>()

  const technical = scopedFacts.filter((fact) => TECHNICAL_FUNCTIONAL_CODES.has(fact.code))
  if (technical.length) {
    output.push(summarizeFactGroup(technical, area, 'code_logic', 'structural', 'технические обработчики и точки взаимодействия'))
    for (const fact of technical) consumed.add(fact.id)
  }

  const groupIfLarge = (codes: SemanticFactCode[], level: SemanticLevel, label: string, threshold: number) => {
    const group = scopedFacts.filter((fact) => codes.includes(fact.code) && fact.level === level && !consumed.has(fact.id))
    if (group.length < threshold) return
    output.push(summarizeFactGroup(group, area, codes[0], level, label))
    for (const fact of group) consumed.add(fact.id)
  }

  groupIfLarge(['function', 'class', 'interface', 'type_definition', 'component'], 'structural', 'основные программные сущности', 16)
  groupIfLarge(['database_column'], 'structural', 'поля базы данных', 12)
  groupIfLarge(['database_index', 'database_relation'], 'structural', 'индексы и связи базы данных', 8)

  const remaining = scopedFacts.filter((fact) => !consumed.has(fact.id))
  const priority = (fact: SemanticFact): number => {
    if (fact.level === 'functional' && fact.certainty === 'fact') return 0
    if (fact.level === 'functional') return 1
    if (fact.code === 'database_table' || fact.code === 'test_case') return 2
    if (fact.level === 'structural') return 3
    return 4
  }
  remaining.sort((left, right) => priority(left) - priority(right) || right.confidence - left.confidence || left.subject.localeCompare(right.subject))

  const maxFacts = 70
  output.push(...remaining.slice(0, Math.max(0, maxFacts - output.length)))
  return {
    facts: output,
    omitted: Math.max(0, facts.length - scopedFacts.length) + Math.max(0, remaining.length - Math.max(0, maxFacts - output.length)),
  }
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  php: 'PHP', js: 'JavaScript', jsx: 'JavaScript/React', ts: 'TypeScript', tsx: 'TypeScript/React', py: 'Python',
  sql: 'SQL', html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON', yaml: 'YAML', yml: 'YAML',
  md: 'Markdown', java: 'Java', kt: 'Kotlin', cs: 'C#', go: 'Go', rb: 'Ruby', rs: 'Rust', sh: 'Shell', ps1: 'PowerShell',
}

function semanticForCluster(
  area: FeatureAreaCode,
  areaFacts: SemanticFact[],
  changes: FileChange[],
  supportingFiles: string[],
  from: Snapshot,
  to: Snapshot,
  clusterConfidence: number,
  capability: ClusterCapability,
): SemanticAnalysis {
  const compressed = compressFacts(area, areaFacts, changes, clusterConfidence, capability)
  const primaryPaths = [...new Set(changes.map((change) => change.path))]
  const textPaths = primaryPaths.filter((path) => (to.files[path] ?? from.files[path])?.kind === 'text')
  const binaryFiles = primaryPaths.length - textPaths.length
  const represented = new Set(compressed.facts.flatMap((fact) => fact.evidence.map((item) => item.path)))
  const fallbackPaths = new Set(compressed.facts.filter((fact) => fact.level === 'fallback').flatMap((fact) => fact.evidence.map((item) => item.path)))
  const languages = new Set<string>()
  for (const path of textPaths) {
    const extension = path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
    if (extension && LANGUAGE_BY_EXTENSION[extension]) languages.add(LANGUAGE_BY_EXTENSION[extension])
  }
  const analyzedTextFiles = textPaths.filter((path) => (to.files[path]?.content ?? from.files[path]?.content) !== undefined).length
  const representedTextFiles = textPaths.filter((path) => represented.has(path) || changes.some((change) => change.path === path)).length
  const warnings: string[] = []
  if (fallbackPaths.size) warnings.push(`${fallbackPaths.size} text files required generic fallback descriptions.`)
  if (binaryFiles) warnings.push(`${binaryFiles} binary files were not semantically inspected.`)
  if (compressed.omitted) warnings.push(`${compressed.omitted} lower-priority semantic facts were summarized or omitted.`)
  if (supportingFiles.length) warnings.push(`${supportingFiles.length} shared files supplied only feature-specific evidence; unrelated facts from them were excluded.`)
  return {
    facts: compressed.facts,
    analyzedTextFiles,
    candidateTextFiles: textPaths.length,
    representedTextFiles,
    fallbackTextFiles: fallbackPaths.size,
    binaryFiles,
    detectedLanguages: [...languages].sort(),
    coveragePercent: textPaths.length === 0 ? 100 : Math.round((representedTextFiles / textPaths.length) * 100),
    truncatedFacts: compressed.omitted,
    warnings,
  }
}

function descriptionForCluster(capability: ClusterCapability, semantic: SemanticAnalysis, changes: FileChange[]): string {
  const functional = semantic.facts.filter((fact) => fact.level === 'functional' && !fact.id.startsWith('cluster-')).slice(0, 2)
  const subjects = functional.map((fact) => fact.subject).filter(Boolean)
  return subjects.length
    ? `${capability.title}. Дополнительно подтверждено: ${subjects.join('; ')}. Основных файлов: ${changes.length}.`
    : `${capability.title}. Основных файлов: ${changes.length}.`
}

function buildFeatureTree(commits: InferredCommit[]): FeatureTreeNode[] {
  const groups: FeatureGroupCode[] = ['product', 'access', 'platform', 'quality']
  return groups.flatMap((group) => {
    const groupCommits = commits.filter((commit) => commit.cluster.group === group)
    if (!groupCommits.length) return []
    return [{
      id: `group-${group}`,
      group,
      title: GROUP_LABELS_RU[group],
      commitIds: groupCommits.map((commit) => commit.id),
      fileCount: groupCommits.reduce((sum, commit) => sum + commit.changes.length, 0),
      semanticFactCount: groupCommits.reduce((sum, commit) => sum + commit.semantic.facts.length, 0),
      children: groupCommits.map((commit) => ({
        id: `feature-${commit.featureArea}-${commit.id}`,
        area: commit.featureArea,
        title: commit.title,
        commitId: commit.id,
        confidence: commit.cluster.confidence,
        fileCount: commit.changes.length,
        semanticFactCount: commit.semantic.facts.length,
      })),
    }]
  })
}

export function inferFeatureCommits(
  transitionId: string,
  changes: FileChange[],
  from: Snapshot,
  to: Snapshot,
  scope: ScopeAnalysis,
): { commits: InferredCommit[]; featureTree: FeatureTreeNode[] } {
  if (!changes.length) return { commits: [], featureTree: [] }

  const globalSemantic = analyzeSemanticChanges(changes, from, to, { maxFacts: 4_000 })
  const factsByPath = new Map<string, SemanticFact[]>()
  for (const fact of globalSemantic.facts) {
    for (const evidence of fact.evidence) {
      const items = factsByPath.get(evidence.path) ?? []
      items.push(fact)
      factsByPath.set(evidence.path, items)
    }
  }

  const assignments = new Map<string, Assignment>()
  for (const change of changes) assignments.set(change.path, assignmentForChange(change, from, to, factsByPath))

  for (const change of changes) {
    if (!/(?:^|\/)includes\/functions\.php$/i.test(change.path)) continue
    const fileFacts = factsByPath.get(change.path) ?? []
    if (!fileFacts.some((fact) => explicitAreaFromSubject(fact.subject) === 'foundation')) continue
    const current = assignments.get(change.path)
    if (!current) continue
    assignments.set(change.path, {
      ...current,
      area: 'foundation',
      confidence: Math.max(84, current.confidence),
      signals: [...current.signals, 'shared-core:dev-database'].slice(0, 6),
      secondary: [...new Set(['database' as FeatureAreaCode, 'contracts' as FeatureAreaCode, ...current.secondary])].slice(0, 4),
    })
  }

  for (const change of changes) {
    const assignment = assignments.get(change.path)
    if (assignment?.area !== 'database') continue
    const databaseFacts = (factsByPath.get(change.path) ?? []).filter((fact) => fact.code === 'database_table')
    const explicitAreas = [...new Set(databaseFacts.map((fact) => explicitAreaFromSubject(fact.subject)).filter((area): area is FeatureAreaCode => Boolean(area)))]
    if (explicitAreas.length === 1) {
      assignments.set(change.path, {
        ...assignment,
        area: explicitAreas[0],
        confidence: Math.max(78, assignment.confidence),
        signals: [...assignment.signals, `schema:${explicitAreas[0]}`].slice(0, 6),
        secondary: [...new Set(['database' as FeatureAreaCode, ...assignment.secondary])].slice(0, 4),
      })
    }
  }

  if ([...assignments.values()].some((assignment) => assignment.area === 'foundation')) {
    for (const [path, assignment] of assignments) {
      if (assignment.area === 'other') assignments.set(path, { ...assignment, area: 'foundation', confidence: Math.max(52, assignment.confidence - 8), signals: [...assignment.signals, 'fallback:foundation'] })
    }
  }

  const initialChangesByArea = new Map<FeatureAreaCode, FileChange[]>()
  for (const change of changes) {
    const area = assignments.get(change.path)?.area ?? 'other'
    const items = initialChangesByArea.get(area) ?? []
    items.push(change)
    initialChangesByArea.set(area, items)
  }
  const noRedirects = new Map<FeatureAreaCode, FeatureAreaCode>()
  const initialFactsByArea = partitionFactsByArea(globalSemantic.facts, assignments, noRedirects)

  const redirectedAreas = new Map<FeatureAreaCode, FeatureAreaCode>()
  const minorSourceAreas: FeatureAreaCode[] = []
  for (const [area, areaChanges] of initialChangesByArea) {
    if (area === 'minor_fixes' || area === 'documentation') continue
    const areaFacts = resolveFactConflicts(initialFactsByArea.get(area) ?? [])
    if (!isSignificantCluster(area, areaChanges, areaFacts)) {
      redirectedAreas.set(area, 'minor_fixes')
      minorSourceAreas.push(area)
    }
  }

  if (minorSourceAreas.length) {
    for (const [path, assignment] of assignments) {
      if (!redirectedAreas.has(assignment.area)) continue
      assignments.set(path, {
        ...assignment,
        area: 'minor_fixes',
        confidence: Math.max(58, assignment.confidence - 4),
        signals: [...assignment.signals, `merged:${redirectedAreas.get(assignment.area)}`].slice(0, 6),
      })
    }
  }

  const factsByArea = partitionFactsByArea(globalSemantic.facts, assignments, redirectedAreas)
  const changesByArea = new Map<FeatureAreaCode, FileChange[]>()
  for (const change of changes) {
    const area = assignments.get(change.path)?.area ?? 'other'
    const items = changesByArea.get(area) ?? []
    items.push(change)
    changesByArea.set(area, items)
  }

  const commits: InferredCommit[] = []
  for (const rule of AREA_RULES) {
    const areaChanges = changesByArea.get(rule.area) ?? []
    if (!areaChanges.length) continue
    const areaFacts = resolveFactConflicts(factsByArea.get(rule.area) ?? [])
    const primaryPaths = new Set(areaChanges.map((change) => change.path))
    const supportingFiles = [...new Set(areaFacts.flatMap((fact) => fact.evidence.map((item) => item.path)))]
      .filter((path) => !primaryPaths.has(path) && changes.some((change) => change.path === path))
      .sort()
    const areaAssignments = areaChanges.map((change) => assignments.get(change.path)!).filter(Boolean)
    const clusterConfidence = Math.round(areaAssignments.reduce((sum, assignment) => sum + assignment.confidence, 0) / Math.max(areaAssignments.length, 1))
    const relatedCounts = new Map<FeatureAreaCode, number>()
    for (const assignment of areaAssignments) for (const secondary of assignment.secondary) relatedCounts.set(secondary, (relatedCounts.get(secondary) ?? 0) + 1)
    const relatedAreas = rule.area === 'minor_fixes'
      ? [...new Set(minorSourceAreas)]
      : [...relatedCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4).map(([area]) => area)
    const signalPaths = areaChanges.slice(0, 5).map((change) => change.path)
    const signals = [...new Set([...areaAssignments.flatMap((assignment) => assignment.signals), ...signalPaths])].slice(0, 8)
    const capability = clusterCapability(rule.area, areaChanges, areaFacts, relatedAreas)
    const semantic = semanticForCluster(rule.area, areaFacts, areaChanges, supportingFiles, from, to, clusterConfidence, capability)
    const categories = categoryRanking(areaChanges)
    const id = `${transitionId}-${String(rule.sequence).padStart(3, '0')}-${rule.area}-${stableId(areaChanges.map((change) => `${change.status}:${change.path}`).join('|'))}`
    const cluster: FeatureCluster = {
      area: rule.area,
      group: rule.group,
      confidence: clusterConfidence,
      sequence: rule.sequence,
      signals,
      relatedAreas,
      primaryFileCount: areaChanges.length,
      supportingFileCount: supportingFiles.length,
      inferredSplit: changesByArea.size > 1,
    }
    commits.push({
      id,
      category: categories[0] ?? 'other',
      categories,
      featureTags: detectFeatureTags(rule.area, semantic.facts),
      featureArea: rule.area,
      cluster,
      supportingFiles,
      title: capability.title,
      description: descriptionForCluster(capability, semantic, areaChanges),
      confidence: scope.historyConfidencePercent,
      classificationConfidence: clusterConfidence,
      changes: [...areaChanges].sort((left, right) => left.path.localeCompare(right.path)),
      semantic,
    })
  }

  commits.sort((left, right) => left.cluster.sequence - right.cluster.sequence || left.title.localeCompare(right.title))
  return { commits, featureTree: buildFeatureTree(commits) }
}

export function featureAreaLabelRu(area: FeatureAreaCode): string {
  return AREA_LABELS_RU[area]
}
