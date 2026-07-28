# Changelog

## 0.7.0 — 2026-07-28

### Added

- Project relationship verification before archive transitions are compared
- Project identity hints from domains, package names and compiled binary names
- Browser-export detection for pages saved with associated `_files` folders
- Binary release-package detection
- Snapshot diagnostics in the interface and exported report
- Explicit skipped-transition reports instead of false commits

### Fixed

- Browser-saved Django pages are no longer treated as source-code snapshots
- Minified jQuery, Select2, IMask, XRegExp and generated static bundles are excluded from semantic claims
- One-letter and meaningless minified symbols are no longer reported as project functions or classes
- Unrelated projects are no longer chained into one reconstructed history in automatic mode
- Generated and third-party files no longer inflate functional coverage
- Date-only input no longer displays an invented 12:00 timestamp
- Default commit source now names both archives in the transition

## 0.6.0 — 2026-07-28

- Added Functional Diff Engine
- Added structural facts for symbols, routes, SQL, manifests, forms and tests
- Added functional descriptions with evidence and confidence
- Added fallback coverage for unclassified text changes

## 0.5.0 — 2026-07-28

- Added full snapshot versus module/patch detection
- Prevented unconfirmed removals in partial archives
- Changed one transition into one reconstructed change set

## 0.4.0 — 2026-07-28

- Added multi-format archive support through libarchive.js
- Added detailed archive errors
- Added liquid black interface and detailed commit dossier

## 0.1.0 — 2026-07-27

- Added browser-only snapshot analysis, SHA-256 comparison, exports, demo and GitHub Pages deployment
