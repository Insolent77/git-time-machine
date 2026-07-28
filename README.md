# Git Time Machine

> Reconstruct a plausible development history from old project archives — entirely in the browser.

Git Time Machine compares multiple ZIP snapshots of the same project, detects file-level changes, estimates added and removed lines, groups related work into inferred commits, and exports a reviewable `CHANGELOG.md`.

The application is designed for developers who inherited a project without Git history, kept dated backup archives, or need to document how a prototype evolved.

## Why this project exists

Real projects are not always born inside a clean Git repository. Freelancers and small teams often have folders named:

```text
project-final.zip
project-final-2.zip
project-21-07-updated.zip
project-really-final.zip
```

Git Time Machine turns that archive pile into a structured, transparent reconstruction. It does **not** claim to recover the original commits; it creates an evidence-based draft that a developer can review and edit.

## Features

- Multi-archive ZIP upload with editable version names and dates
- 100% client-side processing; source code is not uploaded to a server
- Automatic removal of a shared top-level archive folder
- Ignores common generated folders such as `node_modules`, `.git`, `dist`, `build`, and caches
- SHA-256 content comparison
- Added, modified, and removed file detection
- Text line delta estimation with a bounded LCS algorithm
- Change classification: auth, database, admin, API, UI, styles, tests, docs, config, dependencies, assets
- Inferred commit titles, descriptions, affected files, and confidence scores
- Timeline, searchable file view, and Markdown preview
- Export to `CHANGELOG.md`, full Markdown report, and JSON
- Built-in demo mode
- Automatic GitHub Pages deployment

## Tech stack

- React
- TypeScript
- Vite
- JSZip
- Web Crypto API
- GitHub Actions + GitHub Pages

## Local development

Requirements: Node.js 22+

```bash
npm install
npm run dev
```

Production build:

```bash
npm run test:core
npm run build
npm run preview
```

## Deploy to GitHub Pages

The repository is preconfigured for a project named `git-time-machine`.

1. Create a GitHub repository named `git-time-machine`.
2. Push this project to the `main` branch.
3. Open **Settings → Pages**.
4. Set **Source** to **GitHub Actions**.
5. Open the **Actions** tab and wait for the deploy workflow to finish.

The site URL will be:

```text
https://YOUR_USERNAME.github.io/git-time-machine/
```

For a different repository name, change `base` in `vite.config.ts`.

## How the inference works

For every adjacent pair of snapshots, the analyzer:

1. Builds a normalized map of project files.
2. Compares SHA-256 hashes to detect changes.
3. Estimates line additions and removals for text files.
4. Categorizes file paths using explainable rules.
5. Groups changes by category into inferred commits.
6. Calculates a confidence score from path and group signals.

This is intentionally deterministic and explainable. No external AI API is required.

## Privacy and limits

- Files stay in the browser.
- Classic ZIP files are supported in the MVP.
- Encrypted and multi-volume archives are not supported.
- RAR and 7z are planned.
- Archives are limited to 200 MB, individual files to 12 MB, and 6,000 entries.
- Generated folders are ignored to reduce noise and browser memory usage.
- The reconstructed history is a hypothesis, not cryptographic proof of authorship or the original commit sequence.

## Roadmap

- [ ] RAR and 7z support through WebAssembly
- [ ] Web Worker processing for very large archives
- [ ] Drag-and-drop version reordering
- [ ] Semantic AST diff for TypeScript, JavaScript, PHP, and Python
- [ ] Rename detection
- [ ] Screenshot-based visual UI diff
- [ ] Export a shell script that recreates inferred Git commits
- [ ] Editable commit grouping and titles
- [ ] Save and reopen analysis sessions
- [ ] CLI version

## Project structure

```text
src/
  lib/
    analyzer.ts   # deterministic comparison and commit inference
    demo.ts       # built-in example snapshots
    download.ts   # browser exports
    types.ts      # domain model
    zip.ts        # secure browser-side ZIP processing
  App.tsx         # product UI
  styles.css      # responsive visual system
```

## Safety notes

Archive contents are treated as data. The app does not execute uploaded code. Paths are normalized, traversal segments are removed, and oversized entries are skipped.

## License

MIT
