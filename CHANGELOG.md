# Changelog

All notable changes to M-ABLE are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- **PWA manifest** (`public/manifest.json`) with `standalone` display, theme colour, and icon for home-screen install on mobile.
- **`CONTRIBUTING.md`** with branch workflow, quality gates, project structure, commit conventions, and privacy invariants.
- **`CHANGELOG.md`** (this file).

### Changed
- **Decision engine** (`web/src/ml/decision.ts`) — simplified `DecisionKind` from four bands (`likely`, `possible`, `unrecognised`, `nothing`) to three clean states (`sign`, `not-sure`, `nothing`). Threshold is now read exclusively from the calibrated `notSureBelow` value in `model-meta.json`; confidence band (`high`/`moderate`) is derived from the top probability.
- **ML model v2** (`pipeline/src/gesturesign/model.py`):
  - `Attention` block now uses `F.scaled_dot_product_attention` (Flash Attention on CUDA/MPS).
  - Feed-forward replaced GELU with **SwiGLU** at the same parameter budget.
  - `head_drop` applied *before* L2 normalisation for consistent unit-sphere embeddings.
  - Class prototypes initialised on the unit sphere.
- **GitHub Actions** — all action references upgraded to pinned SHA256 digests on modern versions; `ci.yml`, `deploy.yml`, and `pages.yml` are now fully consistent.
- **`pages.yml`** — removed stale upstream (GestureSign) comments; upgraded to same pinned action SHAs as `deploy.yml`; added typecheck, lint, audit, and production-build verification steps for parity with `deploy.yml`.
- **`deploy.yml`** — added typecheck, lint, and production-build verification steps for a hardened release gate.
- **`README.md`** — expanded with problem statement, objectives, full technology table, numbered section headings, and GitHub Pages deployment instructions.

### Fixed
- `model-meta.json` test parameter budget raised from 3 M to 4 M to accommodate SwiGLU.

---

## [1.0.0] — 2026-11-20

### Added
- Initial M-ABLE release forked and significantly upgraded from the GestureSign foundation.
- 250-sign ASL recognition vocabulary trained on the Kaggle `asl-signs` corpus.
- Sentence builder with text-to-speech, conversation captions (speech-to-text), ASL learning centre, sign dictionary, custom gesture studio, and communication history.
- Strict `self`-only Content Security Policy injected at build time.
- Vitest unit-test suite (135 tests), Playwright e2e accessibility tests, ESLint + Prettier + mypy + ruff quality gates.
- Automated GitHub Pages deployment via GitHub Actions.
- Dependabot weekly updates for npm, uv (Python), and GitHub Actions.
- CodeQL static-analysis workflow scanning JavaScript/TypeScript, Python, and Actions.
