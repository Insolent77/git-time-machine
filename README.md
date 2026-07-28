# Git Time Machine

> Reconstruct a reviewable development history from dated project archives — entirely in the browser.

Git Time Machine compares ZIP, RAR, 7z, TAR and compressed archive snapshots, detects file and structural changes, analyzes source code semantically, and builds a functional map and writes human-readable reconstructed commits grouped by product capability.

It does **not** claim to recover the original Git commits. It produces an evidence-based draft and clearly separates confirmed facts, static inferences, generated artifacts, and transitions that cannot safely be compared.

## Main capabilities

- ZIP, RAR, 7z, TAR, GZ, BZ2 and XZ archives
- Fully local browser processing through JSZip and libarchive.js/WebAssembly
- Automatic detection of full snapshots versus modules/patches
- Automatic alignment of wrapper roots such as `www/`, `public_html/` and workspace folders
- Automatic relationship check before two archives are compared
- No commit is generated when archives cannot be confirmed as versions of the same project
- Detection of browser-saved page exports and compiled binary release packages
- Exclusion of minified, generated, vendored and third-party assets from source-code claims
- SHA-256 comparison for matching files
- Added, modified and reliably removed file detection
- Functional semantic analysis for PHP, JavaScript, TypeScript, SQL, HTML, CSS and other text formats
- Functions, classes, routes, API calls, SQL tables, fields, indexes, forms, dependencies, tests and configuration detection
- Feature clustering into contracts, reviews, leads, students, authentication, cabinet, schedule, homework, payments, communications, database, infrastructure and other coherent areas
- A functional tree that groups reconstructed commits into product, access, platform and quality branches
- Human-readable capability-based commit titles and functional descriptions with evidence and confidence
- Explicit fallback descriptions where the exact purpose cannot be determined
- Five interface languages: English, Russian, Chinese, German and Spanish
- Detailed TXT and JSON exports
- GitHub Pages deployment workflow

## Important safeguards

### Unrelated archives

In automatic mode a transition is skipped when there are no:

- matching analyzable paths;
- shared project identifiers such as the same domain or package name;
- repeated source files by SHA-256.

This prevents a website archive, a browser export from another admin panel and an unrelated binary release from being merged into one fictional Git history.

A manual **Module / patch** override is still available when the developer knows that two differently structured archives belong to the same project.

### Browser exports

Folders created by “Save page as…” usually contain HTML plus copied Django, jQuery, Select2 and other static assets. Git Time Machine classifies these as rendered artifacts rather than authored source code. Minified library functions such as `a`, `$`, `AjaxAdapter` and similar symbols are not emitted as project changes.

### Binary packages

DLL, EXE and similar compiled files can be inventoried and hashed, but their internal functional source changes are not invented. The report explicitly states this limitation.

## Local development

Requirements: Node.js 22+

```bash
npm install
npm run test:core
npm run build
npm run dev
```

## Deploy to GitHub Pages

1. Push the project to the `main` branch.
2. Open **Settings → Pages** in the repository.
3. Select **GitHub Actions** as the source.
4. Wait for the deployment workflow to complete.

Project URL:

```text
https://YOUR_USERNAME.github.io/git-time-machine/
```

## Analysis pipeline

1. Extract and normalize archive paths.
2. Remove hosting logs, caches, dependencies and known generated folders.
3. Profile the archive as source snapshot, browser export, binary package or mixed archive.
4. Extract project identity hints from domains, manifests and binary names.
5. Verify that adjacent archives plausibly belong to one project.
6. Align project roots when archive wrapper folders differ.
7. Resolve full-snapshot versus module/patch semantics.
8. Compare hashes and text changes only for relevant project files.
9. Run structural and functional semantic analysis.
10. Score every changed file against feature-specific path, content and semantic signals.
11. Assign each file to exactly one primary feature cluster.
12. Split merged semantic evidence back by primary feature and isolate documentation from product claims.
13. Resolve contradictory add/remove claims and move technical routes/forms/API details into a compact structural summary.
14. Merge tiny unrelated edits into one `Minor fixes` cluster instead of inventing several weak commits.
15. Generate capability-based commit titles, a functional tree and reviewable reconstructed commits.
16. Mark evidence, clustering confidence, history confidence, limitations and items requiring review.

## Limits

- Uploaded code is never executed.
- Static analysis cannot prove runtime behavior.
- Encrypted and multipart archives are not supported.
- Generated output may hide the original source intent.
- Functional cluster boundaries and order are heuristic when Git metadata is absent. Tiny edits may be merged into a single minor-fixes commit.
- Original Git commit boundaries, authors and exact timestamps cannot be recovered without Git metadata.

## License

MIT
