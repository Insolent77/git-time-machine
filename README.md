# Git Time Machine

> Reconstruct a plausible development history from old project archives — entirely in the browser.

Git Time Machine compares dated snapshots of the same project, detects file-level changes, estimates text deltas, groups related work into inferred commits, and exports detailed `LOCAL-0001` style records.

It is intended for projects that evolved through backup folders and archives instead of a clean Git history. The result is an evidence-based reconstruction, not a claim that the original commits were recovered.

## Features

- ZIP, RAR v4/v5, 7Z, TAR, TAR.GZ, TGZ, GZ, BZ2 and XZ input
- 100% client-side analysis; project files are not uploaded
- JSZip for ZIP and libarchive.js/WebAssembly for other formats
- Precise diagnostic errors with code, archive name, reason, recovery hint and technical detail
- Automatic exclusion of `.git`, `node_modules`, `vendor`, `dist`, `build`, caches and source maps
- SHA-256 comparison for text and binary files
- Added, modified and removed file detection
- Approximate added/removed line counts for text files
- Explainable grouping by auth, database, admin, API, UI, styles, tests, docs, config, dependencies and assets
- Detailed commit dossiers with version number, domain, date/time zone, type, status, source, changes, files and verification notes
- Editable domain, source and status metadata
- Searchable file view and TXT/JSON exports
- Five interface languages: English, Russian, Chinese, German and Spanish
- Minimal black interface with an animated pointer-reactive Liquid Eye
- Automatic GitHub Pages deployment

## Tech stack

- React + TypeScript + Vite
- JSZip
- libarchive.js (WebAssembly + Web Worker)
- Web Crypto API
- GitHub Actions + GitHub Pages

## Local development

Requires Node.js 22+.

```bash
npm install
npm run dev
```

`npm install` copies `worker-bundle.js` and `libarchive.wasm` from `libarchive.js` into the generated `public/libarchive/` directory.

Production check:

```bash
npm run test:core
npm run build
npm run preview
```

## GitHub Pages

The project is configured for a repository named `git-time-machine`.

1. Push the project to the `main` branch.
2. Open **Settings → Pages**.
3. Select **GitHub Actions** as the source.
4. Wait for the deployment workflow to finish.

```text
https://YOUR_USERNAME.github.io/git-time-machine/
```

For another repository name, change `base` in `vite.config.ts`.

## How reconstruction works

For each adjacent pair of snapshots, the analyzer:

1. Extracts and normalizes archive paths.
2. Removes generated and dependency folders.
3. Calculates SHA-256 hashes.
4. Finds added, modified and removed files.
5. Estimates line deltas for text files.
6. Categorizes paths with deterministic rules.
7. Groups related paths into inferred commits.
8. Generates evidence-based verification notes and a confidence score.

No uploaded code is executed and no external AI API is required.

## Limits

- Maximum archive size: 300 MB
- Maximum entries per archive: 8,000
- Files larger than 16 MB are skipped
- Text content is read up to 2 MB per file
- Password-protected archives are detected but password input is not implemented yet
- Multi-volume archives may not be readable
- Browser memory remains the practical limit for large compressed archives
- Reconstructed commits require human review

## Font

The interface requests the locally installed `DXDoklad10M` font and falls back to a system monospace font. A font binary is not included in this repository.

## Project structure

```text
src/
  lib/
    analyzer.ts          # deterministic comparison and commit inference
    archive-errors.ts    # structured diagnostic errors
    demo.ts              # built-in example snapshots
    download.ts          # browser exports
    types.ts             # domain model
    zip.ts               # ZIP + libarchive.js extraction pipeline
  App.tsx                # minimal product interface
  i18n.ts                # five languages and detailed commit export
  styles.css             # black liquid-glass visual system
scripts/
  copy-libarchive-assets.mjs
```

## License

MIT. libarchive.js is used under its MIT license; libarchive is BSD-licensed.
