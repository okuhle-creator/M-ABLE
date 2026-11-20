# Contributing to M-ABLE

Thank you for your interest in improving M-ABLE — **Making Every Ability Understood**.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Branch & PR Workflow](#branch--pr-workflow)
- [Quality Gates](#quality-gates)
- [Project Structure](#project-structure)
- [Commit Message Convention](#commit-message-convention)

---

## Code of Conduct

This project follows a standard contributor code of conduct: be respectful, inclusive, and constructive. Discussions must remain focused on improving accessibility technology that serves Deaf and hard-of-hearing communities.

---

## Getting Started

### Prerequisites

- **Node.js 24+** (LTS) — for the web application
- **Python 3.12+** and [uv](https://docs.astral.sh/uv/) — for the ML pipeline (optional for frontend-only contributions)
- A modern browser supporting WebAssembly SIMD and WebRTC

### Setup

```bash
git clone https://github.com/okuhle-creator/M-ABLE.git
cd M-ABLE/web
npm ci
npm run dev
# Open http://localhost:5330/M-ABLE/
```

---

## Branch & PR Workflow

| Branch | Purpose |
|---|---|
| `main` | Stable, deployed to GitHub Pages |
| `m-able/development` | Active development; PRs target this branch |

1. Fork the repository and create a feature branch from `m-able/development`.
2. Make your changes, following the quality gates below.
3. Open a Pull Request against `m-able/development`.
4. All CI checks must pass before merging.

---

## Quality Gates

Run these before opening a PR:

```bash
# From web/
npm run typecheck        # Zero TypeScript errors
npm run lint             # Zero ESLint warnings
npm run format:check     # Prettier formatting
npm test                 # All 135+ Vitest unit tests pass
npm run build            # Clean production bundle
npm run test:e2e         # Playwright e2e accessibility tests
```

```bash
# From pipeline/ (ML changes only)
uv run ruff check .
uv run mypy
uv run pytest
uv run gesturesign smoke
```

---

## Project Structure

```
M-ABLE/
├── .github/workflows/   # CI, Deploy, CodeQL, Dependabot
├── web/                 # React + TypeScript front-end
│   ├── public/          # Static assets (models, vendor WASM)
│   ├── src/
│   │   ├── app/         # Session orchestration
│   │   ├── components/  # React UI components
│   │   ├── lib/         # Camera, storage, speech utilities
│   │   ├── ml/          # ML inference, features, decision engine
│   │   └── replay/      # Pre-recorded clip system
│   └── e2e/             # Playwright end-to-end tests
├── pipeline/            # Python ML training pipeline
│   ├── src/gesturesign/ # Training, evaluation, ONNX export
│   └── tests/           # Pytest suite
└── shared/              # Feature schema shared between web and pipeline
```

---

## Commit Message Convention

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`

**Examples:**
```
feat(ml): add SwiGLU feed-forward to Transformer blocks
fix(decision): return not-sure when partial shoulder visibility
docs(readme): add GitHub Pages deployment instructions
ci(deploy): pin action SHAs for reproducible builds
```

---

## Privacy Principle

M-ABLE is **100% on-device**. Any contribution must preserve this invariant:

- No camera frames, landmark coordinates, or voice audio may be transmitted over any network socket.
- No external analytics, telemetry, or tracking libraries.
- The strict CSP meta tag (`default-src 'self'`) must remain intact.

Contributions that violate any of the above will not be merged.
