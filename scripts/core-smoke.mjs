import assert from 'node:assert/strict'
import { analyzeSnapshots, buildChangelog, categorizePath } from '../.tmp-core/analyzer.js'
import { makeDemoSnapshots } from '../.tmp-core/demo.js'

const report = analyzeSnapshots(makeDemoSnapshots())

assert.equal(report.snapshots.length, 3)
assert.equal(report.transitions.length, 2)
assert.ok(report.totals.inferredCommits >= 3)
assert.ok(report.totals.filesAdded > 0)
assert.equal(categorizePath('src/auth/session.ts'), 'auth')
assert.equal(categorizePath('src/db/migrations/001.sql'), 'database')
assert.match(buildChangelog(report), /Reconstructed changelog/)

console.log('Core smoke test passed:', {
  transitions: report.transitions.length,
  inferredCommits: report.totals.inferredCommits,
})
