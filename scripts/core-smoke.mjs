import assert from 'node:assert/strict'
import { analyzeSnapshots, buildChangelog, categorizePath, compareSnapshots } from '../.tmp-core/analyzer.js'
import { makeDemoSnapshots } from '../.tmp-core/demo.js'

const report = analyzeSnapshots(makeDemoSnapshots())

assert.equal(report.snapshots.length, 3)
assert.equal(report.transitions.length, 2)
assert.ok(report.totals.inferredCommits >= 6)
assert.ok(report.totals.filesAdded > 0)
assert.ok(report.totals.semanticFacts > 0)
assert.equal(report.totals.semanticCoveragePercent, 100)
assert.ok(report.transitions[0].commits.flatMap((commit) => commit.semantic.facts).some((fact) => fact.code === 'component'))
assert.equal(categorizePath('src/auth/session.ts'), 'auth')
assert.equal(categorizePath('src/db/migrations/001.sql'), 'database')
assert.match(buildChangelog(report), /Reconstructed change sets/)

const oldSnapshot = {
  id: 'old', label: 'Full site', sourceName: 'site.zip', capturedAt: '2026-07-01T12:00:00.000Z', capturePrecision: 'date', totalBytes: 3, ignoredCount: 0, profile: { kind: 'source', identityTokens: ['demo-project'], sourceFiles: 3, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'www/site/index.php': { path: 'www/site/index.php', size: 1, hash: 'a', kind: 'text', content: 'old' },
    'www/site/admin.php': { path: 'www/site/admin.php', size: 1, hash: 'b', kind: 'text', content: 'admin' },
    'www/site/style.css': { path: 'www/site/style.css', size: 1, hash: 'c', kind: 'text', content: 'css' },
  },
}
const moduleSnapshot = {
  id: 'module', label: 'Cabinet module', sourceName: 'cabinet.zip', capturedAt: '2026-07-02T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0, profile: { kind: 'source', identityTokens: ['demo-project'], sourceFiles: 2, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'www/lk/auth/login.php': { path: 'www/lk/auth/login.php', size: 1, hash: 'd', kind: 'text', content: 'password_verify issue_code csrf' },
    'www/lk/schedule/index.php': { path: 'www/lk/schedule/index.php', size: 1, hash: 'e', kind: 'text', content: 'data-calendar' },
  },
}

const patchTransition = compareSnapshots(oldSnapshot, moduleSnapshot, 'auto')
assert.equal(patchTransition.scope.resolvedMode, 'patch')
assert.equal(patchTransition.scope.commonPathCount, 0)
assert.equal(patchTransition.stats.filesRemoved, 0)
assert.equal(patchTransition.scope.ignoredPotentialRemovals, 3)
assert.equal(patchTransition.commits.length, 2)
assert.deepEqual(patchTransition.commits.map((commit) => commit.featureArea), ['authentication', 'schedule'])
assert.ok(patchTransition.commits.find((commit) => commit.featureArea === 'authentication').featureTags.includes('email_code_auth'))
assert.ok(patchTransition.commits.find((commit) => commit.featureArea === 'schedule').featureTags.includes('schedule_calendar'))


const prefixedWorkspace = {
  id: 'prefixed-workspace', label: 'Workspace export', sourceName: 'project.rar', capturedAt: '2026-07-02T13:00:00.000Z', capturePrecision: 'date', totalBytes: 5, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['aligned-project'], sourceFiles: 5, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 1, warnings: [] },
  files: {
    'backup/old.zip': { path: 'backup/old.zip', size: 1, hash: 'backup', kind: 'binary', analysisRole: 'source' },
    'www/app/index.php': { path: 'www/app/index.php', size: 1, hash: 'index-old', kind: 'text', content: '<?php echo "old";' },
    'www/app/auth/login.php': { path: 'www/app/auth/login.php', size: 1, hash: 'login-old', kind: 'text', content: '<?php function login() {}' },
    'www/app/schedule.php': { path: 'www/app/schedule.php', size: 1, hash: 'schedule-same', kind: 'text', content: '<?php function schedule() {}' },
    'www/app/style.css': { path: 'www/app/style.css', size: 1, hash: 'style-same', kind: 'text', content: 'body{}' },
  },
}
const directProject = {
  id: 'direct-project', label: 'Project root', sourceName: 'www.7z', capturedAt: '2026-07-02T14:00:00.000Z', capturePrecision: 'date', totalBytes: 5, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['aligned-project'], sourceFiles: 5, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'app/index.php': { path: 'app/index.php', size: 1, hash: 'index-new', kind: 'text', content: '<?php echo "new";' },
    'app/auth/login.php': { path: 'app/auth/login.php', size: 1, hash: 'login-new', kind: 'text', content: '<?php function login() { password_verify("a", "b"); }' },
    'app/schedule.php': { path: 'app/schedule.php', size: 1, hash: 'schedule-same', kind: 'text', content: '<?php function schedule() {}' },
    'app/style.css': { path: 'app/style.css', size: 1, hash: 'style-same', kind: 'text', content: 'body{}' },
    'app/reviews.php': { path: 'app/reviews.php', size: 1, hash: 'review-new', kind: 'text', content: '<?php function saveReview() {}' },
  },
}
const alignedTransition = compareSnapshots(prefixedWorkspace, directProject, 'auto')
assert.equal(alignedTransition.scope.pathAlignmentApplied, true)
assert.equal(alignedTransition.scope.fromPathPrefix, 'www/')
assert.equal(alignedTransition.scope.toPathPrefix, '')
assert.equal(alignedTransition.scope.commonPathCount, 4)
assert.equal(alignedTransition.stats.filesModified, 2)
assert.equal(alignedTransition.stats.filesAdded, 1)
assert.ok(!alignedTransition.changes.some((change) => change.path.startsWith('backup/')))

const semanticOld = {
  id: 'semantic-old', label: 'Semantic old', sourceName: 'old.zip', capturedAt: '2026-07-03T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  files: {
    'src/auth.ts': { path: 'src/auth.ts', size: 1, hash: 'old-auth', kind: 'text', content: 'export function login(password: string) { return password.length > 3 }' },
    'package.json': { path: 'package.json', size: 1, hash: 'old-package', kind: 'text', content: JSON.stringify({ scripts: { dev: 'vite' }, dependencies: { react: '1.0.0' } }) },
  },
}
const semanticNew = {
  id: 'semantic-new', label: 'Semantic new', sourceName: 'new.zip', capturedAt: '2026-07-04T12:00:00.000Z', capturePrecision: 'date', totalBytes: 4, ignoredCount: 0,
  files: {
    'src/auth.ts': { path: 'src/auth.ts', size: 2, hash: 'new-auth', kind: 'text', content: 'export function login(password: string) { return password.length > 8 }\nexport function verifyOtp(code: string) { return code.length === 6 }\nconst csrfToken = "csrf_token"' },
    'src/api.ts': { path: 'src/api.ts', size: 1, hash: 'api', kind: 'text', content: 'router.post("/login", handler)\nfetch("/api/session", { method: "POST" })' },
    'schema.sql': { path: 'schema.sql', size: 1, hash: 'sql', kind: 'text', content: 'CREATE TABLE auth_codes (id INT);\nCREATE INDEX idx_auth_codes ON auth_codes(id);' },
    'package.json': { path: 'package.json', size: 1, hash: 'new-package', kind: 'text', content: JSON.stringify({ scripts: { dev: 'vite', test: 'vitest' }, dependencies: { react: '2.0.0', zod: '4.0.0' } }) },
  },
}
const semanticTransition = compareSnapshots(semanticOld, semanticNew, 'full')
const semanticFacts = semanticTransition.commits.flatMap((commit) => commit.semantic.facts)
assert.ok(semanticFacts.some((fact) => fact.code === 'function' && fact.operation === 'added' && fact.subject === 'verifyOtp'))
assert.ok(semanticFacts.some((fact) => fact.code === 'code_logic' && fact.operation === 'modified' && fact.subject === 'login'))
assert.ok(semanticFacts.some((fact) => fact.code === 'code_logic' && fact.level === 'structural' && fact.details?.includes('POST /login')))
assert.ok(semanticFacts.some((fact) => fact.code === 'code_logic' && fact.level === 'structural' && fact.details?.includes('POST /api/session')))
assert.ok(!semanticFacts.some((fact) => fact.level === 'functional' && ['route', 'api_request', 'form', 'json_api', 'redirect_navigation'].includes(fact.code)))
assert.ok(semanticFacts.some((fact) => fact.code === 'database_table' && fact.subject === 'auth_codes'))
assert.ok(semanticFacts.some((fact) => fact.code === 'dependency' && fact.subject === 'zod'))
assert.ok(semanticTransition.commits.every((commit) => commit.semantic.coveragePercent === 100))

const forcedFull = compareSnapshots(oldSnapshot, moduleSnapshot, 'full')
assert.equal(forcedFull.scope.resolvedMode, 'full')
assert.equal(forcedFull.stats.filesRemoved, 3)


const unrelatedOne = {
  id: 'unrelated-one', label: 'Website', sourceName: 'website.zip', capturedAt: '2026-07-05T12:00:00.000Z', capturePrecision: 'date', totalBytes: 1, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['alpha-site'], sourceFiles: 1, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: { 'www/alpha-site.com/index.php': { path: 'www/alpha-site.com/index.php', size: 10, hash: 'alpha', kind: 'text', content: '<?php echo "alpha"; ?>', analysisRole: 'source' } },
}
const unrelatedTwo = {
  id: 'unrelated-two', label: 'Game mod', sourceName: 'release.zip', capturedAt: '2026-07-06T12:00:00.000Z', capturePrecision: 'date', totalBytes: 1, ignoredCount: 0,
  profile: { kind: 'binary_package', identityTokens: ['citiesharmony'], sourceFiles: 1, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 1, warnings: [] },
  files: { 'README.txt': { path: 'README.txt', size: 10, hash: 'cities', kind: 'text', content: 'Cities Harmony mod', analysisRole: 'source' } },
}
const unrelatedTransition = compareSnapshots(unrelatedOne, unrelatedTwo, 'auto')
assert.equal(unrelatedTransition.scope.comparisonAllowed, false)
assert.equal(unrelatedTransition.scope.relationship, 'unconfirmed')
assert.equal(unrelatedTransition.commits.length, 0)
assert.equal(unrelatedTransition.changes.length, 0)

const forcedUnrelated = compareSnapshots(unrelatedOne, unrelatedTwo, 'patch')
assert.equal(forcedUnrelated.scope.comparisonAllowed, true)
assert.equal(forcedUnrelated.scope.relationshipReason, 'manual_override')
assert.ok(forcedUnrelated.commits.length >= 1)

const browserSnapshot = {
  id: 'browser', label: 'Saved admin pages', sourceName: 'Desktop.rar', capturedAt: '2026-07-07T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  profile: { kind: 'browser_export', identityTokens: ['mylomonosov'], sourceFiles: 0, artifactFiles: 1, thirdPartyFiles: 1, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'Student admin.html': { path: 'Student admin.html', size: 10, hash: 'page', kind: 'text', content: '<title>Edit student | Django admin</title><form method="post"></form>', analysisRole: 'artifact' },
    'Student admin_files/jquery.min.js': { path: 'Student admin_files/jquery.min.js', size: 10, hash: 'jquery', kind: 'text', content: 'function a(){}', analysisRole: 'third_party' },
  },
}
const browserForced = compareSnapshots(unrelatedOne, browserSnapshot, 'patch')
assert.equal(browserForced.changes.length, 1)
assert.ok(browserForced.commits.flatMap((commit) => commit.semantic.facts).some((fact) => fact.code === 'browser_snapshot'))
assert.ok(!browserForced.commits.flatMap((commit) => commit.semantic.facts).some((fact) => fact.subject === 'a'))

const mixedSequenceReport = analyzeSnapshots([unrelatedOne, browserSnapshot, unrelatedTwo], { comparisonMode: 'auto' })
assert.equal(mixedSequenceReport.transitions.length, 2)
assert.ok(mixedSequenceReport.transitions.every((transition) => transition.scope.comparisonAllowed === false))
assert.equal(mixedSequenceReport.totals.inferredCommits, 0)
assert.equal(mixedSequenceReport.totals.semanticFacts, 0)

const featureOld = {
  id: 'feature-old', label: 'Base site', sourceName: 'base.zip', capturedAt: '2026-07-08T12:00:00.000Z', capturePrecision: 'date', totalBytes: 1, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['alex-educator'], sourceFiles: 1, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: { 'alex-educator.com/index.html': { path: 'alex-educator.com/index.html', size: 5, hash: 'base-index', kind: 'text', content: '<main>Old</main>' } },
}
const featureNew = {
  id: 'feature-new', label: 'Product modules', sourceName: 'www.7z', capturedAt: '2026-07-09T12:00:00.000Z', capturePrecision: 'date', totalBytes: 10, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['alex-educator'], sourceFiles: 10, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'alex-educator.com/index.html': { path: 'alex-educator.com/index.html', size: 8, hash: 'new-index', kind: 'text', content: '<main>New landing</main>' },
    'alex-educator.com/api/submit-lead.php': { path: 'alex-educator.com/api/submit-lead.php', size: 8, hash: 'lead', kind: 'text', content: '<?php function submitLead() { return json_encode([]); }' },
    'alex-educator.com/contract/index.php': { path: 'alex-educator.com/contract/index.php', size: 8, hash: 'contract', kind: 'text', content: '<?php function renderContract() {}' },
    'alex-educator.com/database/contracts.sql': { path: 'alex-educator.com/database/contracts.sql', size: 8, hash: 'contract-db', kind: 'text', content: 'CREATE TABLE contract_clients (id INT);' },
    'alex-educator.com/admin/reviews.php': { path: 'alex-educator.com/admin/reviews.php', size: 8, hash: 'review', kind: 'text', content: '<?php function saveReview() {} function deleteReview() {}' },
    'lk.alex-educator.com/auth/login.php': { path: 'lk.alex-educator.com/auth/login.php', size: 8, hash: 'auth', kind: 'text', content: '<?php password_verify($a,$b); csrf_token();' },
    'lk.alex-educator.com/schedule/index.php': { path: 'lk.alex-educator.com/schedule/index.php', size: 8, hash: 'schedule', kind: 'text', content: '<div data-calendar></div>' },
    'lk.alex-educator.com/homework/index.php': { path: 'lk.alex-educator.com/homework/index.php', size: 8, hash: 'homework', kind: 'text', content: '<?php function submitHomework() {}' },
    'alex-educator.com/database/homework.sql': { path: 'alex-educator.com/database/homework.sql', size: 8, hash: 'homework-db', kind: 'text', content: 'CREATE TABLE homework_assignments (id INT);' },
    'README.md': { path: 'README.md', size: 8, hash: 'readme', kind: 'text', content: '# Installation' },
  },
}
const featureTransition = compareSnapshots(featureOld, featureNew, 'auto')
const featureAreas = featureTransition.commits.map((commit) => commit.featureArea)
assert.ok(featureAreas.includes('lead_requests'))
assert.ok(featureAreas.includes('contracts'))
assert.ok(featureAreas.includes('reviews'))
assert.ok(featureAreas.includes('authentication'))
assert.ok(featureAreas.includes('schedule'))
assert.ok(featureAreas.includes('homework'))
assert.ok(featureTransition.featureTree.length >= 2)
assert.equal(new Set(featureTransition.commits.flatMap((commit) => commit.changes.map((change) => change.path))).size, featureTransition.changes.length)
assert.equal(featureTransition.commits.flatMap((commit) => commit.changes).length, featureTransition.changes.length)



// v0.8.1: documentation is evidence only for documentation and must never create product claims.
const docsOld = {
  id: 'docs-old', label: 'Docs old', sourceName: 'docs-old.zip', capturedAt: '2026-07-10T12:00:00.000Z', capturePrecision: 'date', totalBytes: 3, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['docs-project'], sourceFiles: 3, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'README.md': { path: 'README.md', size: 1, hash: 'docs-readme-old', kind: 'text', content: '# Project\n## Notes' },
    'LOCAL_CHANGELOG.txt': { path: 'LOCAL_CHANGELOG.txt', size: 1, hash: 'docs-local-old', kind: 'text', content: 'Удалено: личный кабинет, расписание и домашние задания' },
    'admin/review.php': { path: 'admin/review.php', size: 1, hash: 'docs-review-old', kind: 'text', content: '<?php echo "old";' },
  },
}
const docsNew = {
  id: 'docs-new', label: 'Docs new', sourceName: 'docs-new.zip', capturedAt: '2026-07-11T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['docs-project'], sourceFiles: 2, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'README.md': { path: 'README.md', size: 1, hash: 'docs-readme-new', kind: 'text', content: '# Project\n## Удалено: личный кабинет, расписание и домашние задания' },
    'admin/review.php': { path: 'admin/review.php', size: 1, hash: 'docs-review-new', kind: 'text', content: '<?php echo "new";' },
  },
}
const docsTransition = compareSnapshots(docsOld, docsNew, 'full')
const docsProductFacts = docsTransition.commits
  .filter((commit) => commit.featureArea !== 'documentation')
  .flatMap((commit) => commit.semantic.facts)
assert.ok(!docsProductFacts.some((fact) => fact.evidence.some((item) => item.path === 'README.md')))
assert.ok(!docsProductFacts.some((fact) => fact.operation === 'removed' && ['user_cabinet', 'schedule_section', 'homework_section'].includes(fact.code)))
assert.ok(docsTransition.commits.find((commit) => commit.featureArea === 'documentation')?.semantic.facts.every((fact) => fact.code === 'documentation_section' || fact.code === 'file_content'))
assert.ok(docsTransition.commits.find((commit) => commit.featureArea === 'documentation')?.changes.some((change) => change.path === 'LOCAL_CHANGELOG.txt'))

// v0.8.1: tiny unrelated changes are combined into one honest minor-fixes commit.
const tinyOld = {
  id: 'tiny-old', label: 'Tiny old', sourceName: 'tiny-old.zip', capturedAt: '2026-07-12T12:00:00.000Z', capturePrecision: 'date', totalBytes: 3, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['tiny-project'], sourceFiles: 3, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'admin/request.php': { path: 'admin/request.php', size: 1, hash: 'tiny-request-old', kind: 'text', content: '<?php echo "a";' },
    'admin/review.php': { path: 'admin/review.php', size: 1, hash: 'tiny-review-old', kind: 'text', content: '<?php echo "b";' },
    'auth/login.php': { path: 'auth/login.php', size: 1, hash: 'tiny-login-old', kind: 'text', content: '<?php echo "c";' },
  },
}
const tinyNew = {
  id: 'tiny-new', label: 'Tiny new', sourceName: 'tiny-new.zip', capturedAt: '2026-07-13T12:00:00.000Z', capturePrecision: 'date', totalBytes: 3, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['tiny-project'], sourceFiles: 3, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'admin/request.php': { path: 'admin/request.php', size: 1, hash: 'tiny-request-new', kind: 'text', content: '<?php echo "aa";' },
    'admin/review.php': { path: 'admin/review.php', size: 1, hash: 'tiny-review-new', kind: 'text', content: '<?php echo "bb";' },
    'auth/login.php': { path: 'auth/login.php', size: 1, hash: 'tiny-login-new', kind: 'text', content: '<?php echo "cc";' },
  },
}
const tinyTransition = compareSnapshots(tinyOld, tinyNew, 'full')
assert.deepEqual(tinyTransition.commits.map((commit) => commit.featureArea), ['minor_fixes'])
assert.ok(tinyTransition.commits[0].cluster.relatedAreas.includes('lead_requests'))
assert.ok(tinyTransition.commits[0].cluster.relatedAreas.includes('reviews'))
assert.ok(tinyTransition.commits[0].cluster.relatedAreas.includes('authentication'))
assert.match(tinyTransition.commits[0].title, /Исправлены небольшие изменения/)
assert.equal(tinyTransition.commits[0].semantic.facts.filter((fact) => fact.level === 'functional').length, 1)

// v0.8.1: generic facts merged across files are scoped back to each primary cluster.
const scopedOld = {
  id: 'scoped-old', label: 'Scoped old', sourceName: 'scoped-old.zip', capturedAt: '2026-07-14T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['scoped-project'], sourceFiles: 2, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'admin/student.php': { path: 'admin/student.php', size: 1, hash: 'student-old', kind: 'text', content: '<?php function page() { return 1; }' },
    'contract/index.php': { path: 'contract/index.php', size: 1, hash: 'contract-old', kind: 'text', content: '<?php function page() { return 1; }' },
  },
}
const scopedNew = {
  id: 'scoped-new', label: 'Scoped new', sourceName: 'scoped-new.zip', capturedAt: '2026-07-15T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['scoped-project'], sourceFiles: 2, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'admin/student.php': { path: 'admin/student.php', size: 1, hash: 'student-new', kind: 'text', content: '<?php function page() { $searchQuery = "student"; return 2; }' },
    'contract/index.php': { path: 'contract/index.php', size: 1, hash: 'contract-new', kind: 'text', content: '<?php function page() { $searchQuery = "contract"; return 2; }' },
  },
}
const scopedTransition = compareSnapshots(scopedOld, scopedNew, 'full')
for (const commit of scopedTransition.commits.filter((item) => ['students', 'contracts'].includes(item.featureArea))) {
  for (const fact of commit.semantic.facts.filter((item) => item.code === 'search')) {
    assert.ok(fact.evidence.every((item) => commit.changes.some((change) => change.path === item.path)))
  }
}

// v0.8.1: opposite broad claims are collapsed into one modified fact.
const conflictOld = {
  id: 'conflict-old', label: 'Conflict old', sourceName: 'conflict-old.zip', capturedAt: '2026-07-16T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['conflict-project'], sourceFiles: 2, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'contract/first.php': { path: 'contract/first.php', size: 1, hash: 'conflict-first-old', kind: 'text', content: '<?php echo "contract_clients";' },
    'contract/second.php': { path: 'contract/second.php', size: 1, hash: 'conflict-second-old', kind: 'text', content: '<?php echo "empty";' },
  },
}
const conflictNew = {
  id: 'conflict-new', label: 'Conflict new', sourceName: 'conflict-new.zip', capturedAt: '2026-07-17T12:00:00.000Z', capturePrecision: 'date', totalBytes: 2, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['conflict-project'], sourceFiles: 2, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'contract/first.php': { path: 'contract/first.php', size: 1, hash: 'conflict-first-new', kind: 'text', content: '<?php echo "empty";' },
    'contract/second.php': { path: 'contract/second.php', size: 1, hash: 'conflict-second-new', kind: 'text', content: '<?php echo "contract_clients";' },
  },
}
const conflictTransition = compareSnapshots(conflictOld, conflictNew, 'full')
const contractFacts = conflictTransition.commits.find((commit) => commit.featureArea === 'contracts')?.semantic.facts ?? []
const broadContractFacts = contractFacts.filter((fact) => fact.code === 'contract_section')
assert.ok(broadContractFacts.length <= 2)
assert.ok(!(broadContractFacts.some((fact) => fact.operation === 'added') && broadContractFacts.some((fact) => fact.operation === 'removed')))

// v0.8.1: commit titles describe the detected product capability, not only the area name.
const titleOld = {
  id: 'title-old', label: 'Title old', sourceName: 'title-old.zip', capturedAt: '2026-07-18T12:00:00.000Z', capturePrecision: 'date', totalBytes: 1, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['title-project'], sourceFiles: 1, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: { 'admin/student.php': { path: 'admin/student.php', size: 1, hash: 'title-student-old', kind: 'text', content: '<?php echo "student";' } },
}
const titleNew = {
  id: 'title-new', label: 'Title new', sourceName: 'title-new.zip', capturedAt: '2026-07-19T12:00:00.000Z', capturePrecision: 'date', totalBytes: 3, ignoredCount: 0,
  profile: { kind: 'source', identityTokens: ['title-project'], sourceFiles: 3, artifactFiles: 0, thirdPartyFiles: 0, generatedFiles: 0, binaryFiles: 0, warnings: [] },
  files: {
    'admin/student.php': { path: 'admin/student.php', size: 1, hash: 'title-student-new', kind: 'text', content: '<?php echo "student";' },
    'admin/update-student-contact.php': { path: 'admin/update-student-contact.php', size: 1, hash: 'title-contact-new', kind: 'text', content: '<?php $phone = $_POST["phone"]; $email = $_POST["email"];' },
    'admin/assets/student-grade-chart.js': { path: 'admin/assets/student-grade-chart.js', size: 1, hash: 'title-grade-new', kind: 'text', content: 'function movingAverage(){} function renderRangeCalendar(){}' },
  },
}
const titleTransition = compareSnapshots(titleOld, titleNew, 'full')
assert.equal(titleTransition.commits.find((commit) => commit.featureArea === 'students')?.title, 'Добавлены редактирование контактов и график успеваемости ученика')

console.log('Core smoke test passed:', {
  transitions: report.transitions.length,
  reconstructedChangeSets: report.totals.inferredCommits,
  patchRemovalsIgnored: patchTransition.scope.ignoredPotentialRemovals,
  semanticFacts: report.totals.semanticFacts,
  semanticCoverage: report.totals.semanticCoveragePercent,
})
