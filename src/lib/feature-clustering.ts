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
  quality: 'test_case', documentation: 'documentation_section', assets: 'file_content', other: 'code_logic',
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
    ['lead_requests', /submit[_-]?lead|course[_-]?request|consultation[_-]?request/],
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
  const scored = scoreText(change.path, activeContent(change, from, to), change.category)
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
    ['contracts', /contract|agreement/], ['reviews', /review/], ['homework', /homework|assignment|submission|learning_stream/],
    ['schedule', /schedule|lesson/], ['communications', /email|message|notification/], ['students', /student|grade|attendance/],
    ['payments', /payment|receipt|invoice/], ['lead_requests', /course_request|consultation|lead/], ['authentication', /auth|password|session|token|verification|otp|code/],
  ]
  return hints.find(([, pattern]) => pattern.test(value))?.[0]
}

function assignmentForFact(fact: SemanticFact, primaryAssignments: Map<string, Assignment>): FeatureAreaCode {
  const path = fact.evidence[0]?.path ?? ''
  const pathAssignment = primaryAssignments.get(path)
  if (fact.level === 'fallback' || fact.code === 'browser_snapshot' || fact.code === 'external_dependency_bundle') {
    return pathAssignment?.area ?? 'other'
  }
  const hint = FACT_AREA_HINTS[fact.code]
  const scored = scoreText(path, `${fact.subject}\n${fact.details?.join('\n') ?? ''}`, undefined, [fact.code])
  const scores = new Map<FeatureAreaCode, number>()
  for (const item of scored) scores.set(item.area, item.score)
  if (pathAssignment) scores.set(pathAssignment.area, (scores.get(pathAssignment.area) ?? 0) + 7)
  if (hint) scores.set(hint, (scores.get(hint) ?? 0) + 9)

  // Product-specific database names should follow the product rather than a generic database bucket.
  const explicitSubjectArea = explicitAreaFromSubject(fact.subject)
  if (explicitSubjectArea) {
    const bonus = fact.code.startsWith('database_') ? 52 : 20
    scores.set(explicitSubjectArea, (scores.get(explicitSubjectArea) ?? 0) + bonus)
    if (fact.code.startsWith('database_')) scores.set('database', Math.max(0, (scores.get('database') ?? 0) - 18))
  }

  return [...scores.entries()].sort((left, right) => right[1] - left[1] || RULE_BY_AREA.get(left[0])!.sequence - RULE_BY_AREA.get(right[0])!.sequence)[0]?.[0]
    ?? pathAssignment?.area
    ?? hint
    ?? 'other'
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
    quality: 'Добавлены проверки и тесты', documentation: 'Подготовлена документация', assets: 'Добавлены медиа-ресурсы',
    other: 'Добавлены прочие компоненты',
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

function synthesizeSummaryFact(area: FeatureAreaCode, changes: FileChange[], confidence: number): SemanticFact {
  const operation = dominantOperation(changes)
  const evidence = changes.slice(0, 8).map((change) => ({ path: change.path }))
  return {
    id: `cluster-${stableId(`${area}:${operation}:${changes.map((change) => change.path).join('|')}`)}`,
    code: FEATURE_CODE_BY_AREA[area],
    operation,
    certainty: 'inference',
    level: 'functional',
    confidence: Math.max(62, Math.min(94, confidence - 2)),
    subject: AREA_LABELS_RU[area],
    details: [`сгруппировано файлов: ${changes.length}`],
    evidence,
  }
}

function summarizeFactGroup(facts: SemanticFact[], area: FeatureAreaCode, code: SemanticFactCode, level: SemanticLevel, label: string): SemanticFact {
  const operation = facts[0]?.operation ?? 'modified'
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

function compressFacts(area: FeatureAreaCode, facts: SemanticFact[], changes: FileChange[], clusterConfidence: number): { facts: SemanticFact[]; omitted: number } {
  const scopedFacts = area === 'documentation'
    ? facts.filter((fact) => fact.level === 'fallback' || ['documentation_section', 'installation_setup', 'file_content'].includes(fact.code))
    : facts
  const output: SemanticFact[] = [synthesizeSummaryFact(area, changes, clusterConfidence)]
  const consumed = new Set<string>()
  const groupIfLarge = (codes: SemanticFactCode[], level: SemanticLevel, label: string, threshold: number) => {
    const group = scopedFacts.filter((fact) => codes.includes(fact.code) && fact.level === level)
    if (group.length < threshold) return
    output.push(summarizeFactGroup(group, area, codes[0], level, label))
    for (const fact of group) consumed.add(fact.id)
  }

  groupIfLarge(['route'], 'functional', 'серверные маршруты', 7)
  groupIfLarge(['api_request'], 'functional', 'API-запросы', 7)
  groupIfLarge(['form'], 'functional', 'формы и действия', 7)
  groupIfLarge(['function', 'class', 'interface', 'type_definition', 'component'], 'structural', 'основные программные сущности', 22)
  groupIfLarge(['database_column'], 'structural', 'поля базы данных', 18)
  groupIfLarge(['database_index', 'database_relation'], 'structural', 'индексы и связи базы данных', 12)

  const remaining = scopedFacts.filter((fact) => !consumed.has(fact.id))
  const priority = (fact: SemanticFact): number => {
    if (fact.level === 'functional' && fact.certainty === 'fact') return 0
    if (fact.level === 'functional') return 1
    if (fact.code === 'database_table' || fact.code === 'test_case') return 2
    if (fact.level === 'structural') return 3
    return 4
  }
  remaining.sort((left, right) => priority(left) - priority(right) || right.confidence - left.confidence || left.subject.localeCompare(right.subject))

  const maxFacts = 90
  output.push(...remaining.slice(0, Math.max(0, maxFacts - output.length)))
  return { facts: output, omitted: Math.max(0, facts.length - scopedFacts.length) + Math.max(0, scopedFacts.length - consumed.size - Math.max(0, maxFacts - 1)) }
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
  globalTruncated: number,
): SemanticAnalysis {
  const compressed = compressFacts(area, areaFacts, changes, clusterConfidence)
  const paths = [...new Set([...changes.map((change) => change.path), ...supportingFiles])]
  const textPaths = paths.filter((path) => (to.files[path] ?? from.files[path])?.kind === 'text')
  const binaryFiles = paths.length - textPaths.length
  const represented = new Set(compressed.facts.flatMap((fact) => fact.evidence.map((item) => item.path)))
  const fallbackPaths = new Set(compressed.facts.filter((fact) => fact.level === 'fallback').flatMap((fact) => fact.evidence.map((item) => item.path)))
  const languages = new Set<string>()
  for (const path of textPaths) {
    const extension = path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
    if (extension && LANGUAGE_BY_EXTENSION[extension]) languages.add(LANGUAGE_BY_EXTENSION[extension])
  }
  const analyzedTextFiles = textPaths.filter((path) => (to.files[path]?.content ?? from.files[path]?.content) !== undefined).length
  const representedTextFiles = textPaths.filter((path) => represented.has(path) || changes.some((change) => change.path === path)).length
  const truncatedFacts = compressed.omitted + globalTruncated
  const warnings: string[] = []
  if (fallbackPaths.size) warnings.push(`${fallbackPaths.size} text files required generic fallback descriptions.`)
  if (binaryFiles) warnings.push(`${binaryFiles} binary files were not semantically inspected.`)
  if (truncatedFacts) warnings.push(`${truncatedFacts} lower-priority semantic facts were summarized or omitted.`)
  return {
    facts: compressed.facts,
    analyzedTextFiles,
    candidateTextFiles: textPaths.length,
    representedTextFiles,
    fallbackTextFiles: fallbackPaths.size,
    binaryFiles,
    detectedLanguages: [...languages].sort(),
    coveragePercent: textPaths.length === 0 ? 100 : Math.round((representedTextFiles / textPaths.length) * 100),
    truncatedFacts,
    warnings,
  }
}

function descriptionForCluster(area: FeatureAreaCode, semantic: SemanticAnalysis, changes: FileChange[]): string {
  const functional = semantic.facts.filter((fact) => fact.level === 'functional' && !fact.id.startsWith('cluster-')).slice(0, 3)
  const subjects = functional.map((fact) => fact.subject).filter(Boolean)
  return subjects.length
    ? `${AREA_LABELS_RU[area]}: ${subjects.join('; ')}. Затронуто основных файлов: ${changes.length}.`
    : `${AREA_LABELS_RU[area]}. Затронуто основных файлов: ${changes.length}.`
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
        id: `feature-${commit.featureArea}`,
        area: commit.featureArea,
        title: AREA_LABELS_RU[commit.featureArea],
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

  // A schema file that contains entities for exactly one product feature belongs to that feature.
  // Multi-domain migrations remain in the database cluster and become supporting evidence for product clusters.
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

  // A generic "other" bucket is folded into the application foundation when possible.
  if ([...assignments.values()].some((assignment) => assignment.area === 'foundation')) {
    for (const [path, assignment] of assignments) {
      if (assignment.area === 'other') assignments.set(path, { ...assignment, area: 'foundation', confidence: Math.max(52, assignment.confidence - 8), signals: [...assignment.signals, 'fallback:foundation'] })
    }
  }

  const factsByArea = new Map<FeatureAreaCode, SemanticFact[]>()
  for (const fact of globalSemantic.facts) {
    const area = assignmentForFact(fact, assignments)
    const items = factsByArea.get(area) ?? []
    items.push(fact)
    factsByArea.set(area, items)
  }

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
    const areaFacts = factsByArea.get(rule.area) ?? []
    const primaryPaths = new Set(areaChanges.map((change) => change.path))
    const supportingFiles = [...new Set(areaFacts.flatMap((fact) => fact.evidence.map((item) => item.path)))]
      .filter((path) => !primaryPaths.has(path) && changes.some((change) => change.path === path))
      .sort()
    const areaAssignments = areaChanges.map((change) => assignments.get(change.path)!).filter(Boolean)
    const clusterConfidence = Math.round(areaAssignments.reduce((sum, assignment) => sum + assignment.confidence, 0) / Math.max(areaAssignments.length, 1))
    const relatedCounts = new Map<FeatureAreaCode, number>()
    for (const assignment of areaAssignments) for (const secondary of assignment.secondary) relatedCounts.set(secondary, (relatedCounts.get(secondary) ?? 0) + 1)
    const relatedAreas = [...relatedCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4).map(([area]) => area)
    const signalPaths = areaChanges.slice(0, 5).map((change) => change.path)
    const signals = [...new Set([...areaAssignments.flatMap((assignment) => assignment.signals), ...signalPaths])].slice(0, 8)
    const semantic = semanticForCluster(rule.area, areaFacts, areaChanges, supportingFiles, from, to, clusterConfidence, 0)
    const categories = categoryRanking(areaChanges)
    const operation = dominantOperation(areaChanges)
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
      title: titleForArea(rule.area, operation),
      description: descriptionForCluster(rule.area, semantic, areaChanges),
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
