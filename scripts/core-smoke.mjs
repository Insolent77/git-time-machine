import assert from 'node:assert/strict'
import { analyzeSnapshots, buildChangelog, categorizePath, compareSnapshots } from '../.tmp-core/analyzer.js'
import { makeDemoSnapshots } from '../.tmp-core/demo.js'

const report = analyzeSnapshots(makeDemoSnapshots())

assert.equal(report.snapshots.length, 3)
assert.equal(report.transitions.length, 2)
assert.equal(report.totals.inferredCommits, 2)
assert.ok(report.totals.filesAdded > 0)
assert.ok(report.totals.semanticFacts > 0)
assert.equal(report.totals.semanticCoveragePercent, 100)
assert.ok(report.transitions[0].commits[0].semantic.facts.some((fact) => fact.code === 'component'))
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
assert.equal(patchTransition.commits.length, 1)
assert.ok(patchTransition.commits[0].featureTags.includes('email_code_auth'))
assert.ok(patchTransition.commits[0].featureTags.includes('schedule_calendar'))


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
const semanticFacts = semanticTransition.commits[0].semantic.facts
assert.ok(semanticFacts.some((fact) => fact.code === 'function' && fact.operation === 'added' && fact.subject === 'verifyOtp'))
assert.ok(semanticFacts.some((fact) => fact.code === 'code_logic' && fact.operation === 'modified' && fact.subject === 'login'))
assert.ok(semanticFacts.some((fact) => fact.code === 'route' && fact.subject === 'POST /login'))
assert.ok(semanticFacts.some((fact) => fact.code === 'api_request' && fact.subject === 'POST /api/session'))
assert.ok(semanticFacts.some((fact) => fact.code === 'database_table' && fact.subject === 'auth_codes'))
assert.ok(semanticFacts.some((fact) => fact.code === 'dependency' && fact.subject === 'zod'))
assert.equal(semanticTransition.commits[0].semantic.coveragePercent, 100)

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
assert.equal(forcedUnrelated.commits.length, 1)

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
assert.ok(browserForced.commits[0].semantic.facts.some((fact) => fact.code === 'browser_snapshot'))
assert.ok(!browserForced.commits[0].semantic.facts.some((fact) => fact.subject === 'a'))

const mixedSequenceReport = analyzeSnapshots([unrelatedOne, browserSnapshot, unrelatedTwo], { comparisonMode: 'auto' })
assert.equal(mixedSequenceReport.transitions.length, 2)
assert.ok(mixedSequenceReport.transitions.every((transition) => transition.scope.comparisonAllowed === false))
assert.equal(mixedSequenceReport.totals.inferredCommits, 0)
assert.equal(mixedSequenceReport.totals.semanticFacts, 0)

console.log('Core smoke test passed:', {
  transitions: report.transitions.length,
  reconstructedChangeSets: report.totals.inferredCommits,
  patchRemovalsIgnored: patchTransition.scope.ignoredPotentialRemovals,
  semanticFacts: report.totals.semanticFacts,
  semanticCoverage: report.totals.semanticCoveragePercent,
})
