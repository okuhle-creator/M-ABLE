# Changelog

All notable changes to M-ABLE are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.1.0] — 2026-11-20

### Added
- **Two-Way Communication Studio** (`web/src/components/CommunicationStudio.tsx`): Dedicated split-perspective communication layout with Signer side (Sign → Voice) and Hearing Partner side (Speech → Live Captions + Quick Responses).
- **ASL Learning Centre & Curricula** (`web/src/components/LearningCenter.tsx`, `web/src/lib/learning-store.ts`): Structured learning modules (Greetings, Emergency, Family, Everyday, Actions, Questions), Sign-of-the-Day, interactive 5-question comprehension quizzes, and daily practice streaks.
- **Personal Vocabulary & Flashcards** (`web/src/components/PersonalVocabulary.tsx`): Interactive flip flashcard studio and bookmarking system linked to the 250-sign dictionary.
- **Learning Analytics & Insights** (`web/src/components/AnalyticsPanel.tsx`): True local mastery metrics, category completion rates, daily streaks, and practice take counters.
- **User Persona & Profile System** (`web/src/components/ProfileModal.tsx`, `web/src/lib/profile-store.ts`): Configurable roles (Deaf Signer, Hearing Learner, Clinician, Guest), primary studio defaults, and one-click JSON backup export.
- **Accessible UI Component Library** (`web/src/components/ui.tsx`, `web/src/lib/toast-store.ts`): Added Dialog/Modal with ESC & focus traps, Toast Notifications container with auto-dismissal, Progress Bars, Stat Cards, Empty States, and Section Headers.
- **Design Tokens & Theme Styling** (`web/src/styles.css`): Expanded geometry, radius, transition timings, and high-contrast WCAG 2.2 AA compliant tokens.
- **Architecture Audit** (`docs/AUDIT.md`): Comprehensive technical assessment of computer vision, neural runtime, and information architecture.

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
