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
assert.ok(semanticFacts.some((fact) => fact.code === 'route' && fact.subject === 'POST /login'))
assert.ok(semanticFacts.some((fact) => fact.code === 'api_request' && fact.subject === 'POST /api/session'))
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

console.log('Core smoke test passed:', {
  transitions: report.transitions.length,
  reconstructedChangeSets: report.totals.inferredCommits,
  patchRemovalsIgnored: patchTransition.scope.ignoredPotentialRemovals,
  semanticFacts: report.totals.semanticFacts,
  semanticCoverage: report.totals.semanticCoveragePercent,
})
