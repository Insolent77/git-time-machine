import type { Snapshot, SnapshotFile } from './types'

function hash(content: string): string {
  let result = 0
  for (let index = 0; index < content.length; index += 1) result = Math.imul(31, result) + content.charCodeAt(index) | 0
  return `demo-${Math.abs(result)}`
}

function textFile(path: string, content: string): SnapshotFile {
  return {
    path,
    content,
    kind: 'text',
    size: new TextEncoder().encode(content).byteLength,
    hash: hash(content),
  }
}

function snapshot(id: string, label: string, capturedAt: string, files: SnapshotFile[]): Snapshot {
  return {
    id,
    label,
    capturedAt,
    sourceName: `${label.toLowerCase().replaceAll(' ', '-')}.zip`,
    files: Object.fromEntries(files.map((file) => [file.path, file])),
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    ignoredCount: 0,
  }
}

export function makeDemoSnapshots(): Snapshot[] {
  return [
    snapshot('demo-v1', 'Prototype', '2026-05-02T12:00:00.000Z', [
      textFile('README.md', '# Tutor workspace\n\nEarly prototype.'),
      textFile('src/index.html', '<main><h1>Tutor workspace</h1></main>'),
      textFile('src/styles.css', 'body { font-family: sans-serif; }'),
    ]),
    snapshot('demo-v2', 'Student cabinet', '2026-05-19T12:00:00.000Z', [
      textFile('README.md', '# Tutor workspace\n\nStudent cabinet and schedule.'),
      textFile('src/pages/dashboard.tsx', 'export function Dashboard() {\n  return <main>Schedule</main>\n}'),
      textFile('src/components/calendar.tsx', 'export function Calendar() {\n  return <section>Calendar</section>\n}'),
      textFile('src/styles.css', 'body { font-family: sans-serif; margin: 0; }\n@media (max-width: 720px) { main { padding: 16px; } }'),
      textFile('package.json', '{"scripts":{"dev":"vite"},"dependencies":{"react":"latest"}}'),
    ]),
    snapshot('demo-v3', 'Contracts and admin', '2026-06-07T12:00:00.000Z', [
      textFile('README.md', '# Tutor workspace\n\nStudent cabinet, schedule, electronic contracts and admin tools.'),
      textFile('src/pages/dashboard.tsx', 'export function Dashboard() {\n  return <main>Schedule and homework</main>\n}'),
      textFile('src/components/calendar.tsx', 'export function Calendar() {\n  return <section>Interactive calendar</section>\n}'),
      textFile('src/admin/contracts.tsx', 'export function ContractsAdmin() {\n  return <section>Contracts</section>\n}'),
      textFile('src/api/contracts.ts', 'export async function createContract(payload: unknown) {\n  return fetch("/api/contracts", { method: "POST", body: JSON.stringify(payload) })\n}'),
      textFile('src/db/migrations/003_contracts.sql', 'CREATE TABLE contracts (id INTEGER PRIMARY KEY, token TEXT UNIQUE, status TEXT);'),
      textFile('src/auth/session.ts', 'export function requireSession(token: string) {\n  if (!token) throw new Error("Unauthorized")\n}'),
      textFile('src/styles.css', 'body { font-family: sans-serif; margin: 0; background: #f7f8fb; }\n@media (max-width: 720px) { main { padding: 16px; } }'),
      textFile('package.json', '{"scripts":{"dev":"vite","test":"vitest"},"dependencies":{"react":"latest"}}'),
      textFile('src/api/contracts.test.ts', 'describe("contracts", () => {\n  it("creates a contract", () => {})\n})'),
    ]),
  ]
}
