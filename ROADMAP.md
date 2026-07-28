# Roadmap

## 0.1 — Browser MVP

- ZIP snapshots
- File hash comparison
- Text line deltas
- Explainable commit inference
- Timeline and exports
- GitHub Pages deployment

## 0.2 — Better reconstruction

- File rename detection using content similarity
- Editable commit titles and groups
- Manual merge or split controls for automatically generated functional clusters
- Project-type detection
- Better dates inferred from archive names and file metadata

## 0.3 — Larger projects

- Web Workers
- Streaming and memory limits
- 7z support through WebAssembly
- Optional RAR support where licensing and browser compatibility allow it

## 0.4–0.8 — Semantic and functional history

- [ ] AST-aware code comparison
- [x] Function, class, endpoint, and database-model changes
- [x] Feature-level summaries instead of path-only grouping
- [x] Functional tree and multi-commit clustering for large transitions
- [x] Primary versus shared supporting files
- [ ] Dependency risk scoring and migration safety analysis

## 1.0 — Git reconstruction toolkit

- CLI application
- Reviewable commit plan
- Export a new Git repository with inferred commit dates
- Signed analysis manifest
- Visual UI comparison from archived static builds
