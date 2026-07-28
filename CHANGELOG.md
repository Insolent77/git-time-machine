# Changelog

## 0.8.1 — 2026-07-28

### Added

- Evidence-scoped semantic facts: each functional cluster receives facts only from its primary files or from an explicitly matched product schema fact
- Automatic `Небольшие исправления` cluster for tiny unrelated edits that do not justify separate reconstructed commits
- Capability-based commit titles for dev databases, contract contact history, student contacts, grade charts, admin calendars, cabinet calendars and student schedule creation
- Conflict resolution that collapses simultaneous add/remove claims for the same semantic concept into one reviewed modification
- Smoke tests for documentation isolation, supporting-evidence scoping, minor-fix merging, conflict resolution and capability titles

### Changed

- README, prefixed changelog files such as `LOCAL_CHANGELOG.txt`, ROADMAP, AGENTS and other documentation are analyzed only as documentation and can no longer create product-feature claims
- Technical routes, forms, API calls, JSON responses and redirects are summarized in the structural section instead of flooding functional changes
- Feature-map entries and dossier `Type` now use the reconstructed capability title rather than only the broad area name
- Supporting shared files no longer contribute unrelated search, sorting, localization or navigation facts to another feature cluster; noisy UI heuristics from shared utility files are suppressed
- Feature-rule fingerprints now use the matched line rather than a wide surrounding window, reducing false “modified feature” claims
- Displayed build number is now `0.8.1` in all interface languages

### Fixed

- Contradictory statements such as “added personal account” and “removed personal account” caused by changelog text, including prefixed files such as `LOCAL_CHANGELOG.txt`
- One-line request and review edits becoming separate low-value commits
- Merged semantic facts retaining evidence from unrelated feature areas
- Generic `GET current page`, `PAGE /...`, JSON and redirect items appearing as top-level product functionality

## 0.8.0 — 2026-07-28

### Added

- Functional Feature Clustering Engine
- Multiple reconstructed commits from one large archive transition
- Feature areas for public site, requests, contracts, reviews, students, authentication, cabinet, schedule, homework, payments, communications, settings, database, infrastructure, quality and assets
- Functional tree grouped into product, access, platform and quality branches
- Primary files and shared supporting files for every reconstructed commit
- Cluster confidence, clustering signals and dependency-based ordering
- Semantic fact compression for large route, form, symbol and database-field lists
- Product-specific schema migration assignment, such as contract and homework tables
- Automatic project-root alignment when one archive wraps the project in folders such as `www/` or `public_html/`
- Smoke tests for root alignment and ensuring that every changed file belongs to exactly one primary cluster

### Changed

- A valid archive transition is no longer forced into one oversized change set
- Commit headers now show functional areas instead of broad technical categories
- Reports now explain that commit splitting and order are inferred rather than original Git boundaries
- Generic infrastructure, asset and foundation rules yield to explicit product-feature paths

### Fixed

- Shared UI and security patterns no longer pull unrelated admin or student files into public-site or authentication commits
- `.codebase-memory`, `.continue` and `.cursor` metadata are excluded from archive analysis
- Workspace backups outside the detected project root no longer become false additions or removals when archive wrapper folders differ

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
