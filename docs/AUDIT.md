# M-ABLE — Architecture & Technical Audit Report

**Product:** M-ABLE (Making Ability Accessible)  
**Audit Date:** 2026-11-20  
**Audit Standard:** Senior Engineering & Assistive Technology Assessment  
**Repository Working Copy:** `c:\Projects\M-ABLE`  

---

## 1. Executive Summary

M-ABLE is an ambitious on-device assistive technology ecosystem engineered to bridge two-way communication between Deaf/hard-of-hearing signers and hearing conversation partners. Unlike common cloud-dependent prototypes, M-ABLE processes high-dimensional kinematic landmarks and neural inference 100% on-device in browser Web Workers using Google MediaPipe Holistic and Microsoft ONNX Runtime WebAssembly SIMD.

This audit evaluates the codebase across architecture, computer vision, neural inference, accessibility, design systems, and deployment readiness.

---

## 2. Component-by-Component Technical Assessment

### 2.1 Computer Vision & Landmark Extraction (`web/src/ml/tracker*`)
- **Implementation:** MediaPipe Holistic landmarker (`holistic_landmarker.task`, ~13.7 MB float16) running in dedicated Web Worker (`tracker.worker.ts`).
- **Capabilities:** Extracts 543 spatial coordinates (face mesh, pose torso, dual 21-point hand skeletons).
- **Parity & Correctness:** Zero-copy `ImageBitmap` frame transfer from `<video>` element on the main thread to Web Worker via `postMessage`.
- **Status:** **Production-grade.** Reliable fallback and memory-safe buffer cycling.

### 2.2 Feature Normalisation & Resampling (`web/src/ml/features.ts`)
- **Implementation:** Centering around shoulder midpoints, normalized by shoulder span distance, horizontal standardization for left/right dominance, linear temporal resampling to consistent 30 FPS.
- **Verification:** Tested extensively in `features.test.ts` (22 unit tests) with exact parity against Python pipeline (`shared/feature_schema.json`).
- **Status:** **Production-grade.**

### 2.3 Neural Sequence Model (`web/src/ml/model*` & `pipeline/src/gesturesign/model.py`)
- **Architecture:** 1.4M parameter Convolutional Stem + Transformer Blocks with SwiGLU feed-forward networks, Flash Attention (`F.scaled_dot_product_attention`), and a 128-d bottleneck embedding layer.
- **Inference Runtime:** ONNX Runtime Web (`ort-wasm-simd-threaded.wasm`) executing in Web Worker (`model.worker.ts`).
- **Vocabulary:** 250 isolated ASL signs derived from the Kaggle `asl-signs` dataset.
- **Few-Shot Custom Gestures:** Cosine distance prototype matcher against stored 128-d unit-sphere embeddings in IndexedDB.
- **Status:** **Functional.** Authentic inference; no mock predictions.

### 2.4 Decision Engine & Uncertainty Calibration (`web/src/ml/decision.ts`)
- **Logic:** Temperature-scaled softmax over shipped signs with calibrated `notSureBelow` cutoff (0.2902) derived from held-out signers.
- **Status:** Honest reporting. Displays "Not sure" when confidence is below threshold or when shoulders are partially obscured.

### 2.5 Speech & Audio Integration (`web/src/lib/speech.ts`)
- **Text-to-Speech:** Native `window.speechSynthesis` with voice, rate, and pitch controls.
- **Speech-to-Text:** Native `webkitSpeechRecognition` / `SpeechRecognition` for conversation captions.
- **Status:** Well-encapsulated; works across modern Chromium and Safari browsers.

---

## 3. Critical Gaps & Transformation Priorities

1. **Information Architecture & Navigation:**
   - Previous interface relied on a monolithic camera stage with nested tabs.
   - Users need dedicated navigation for:
     - **Home / Product Overview**
     - **Live Sign Recognition** (focused camera stage)
     - **Two-Way Communication Studio** (split view for signers & hearing partners)
     - **ASL Learning Centre** (structured curriculum with interactive quizzes)
     - **Sign Dictionary** (250 searchable signs with categories & bookmarking)
     - **Personal Vocabulary** (saved words, flashcards, custom taught signs)
     - **Learning Analytics & Progress** (streaks, sign mastery, historical stats)
     - **Accessibility & Settings Centre** (sensory controls, camera, audio, privacy)

2. **Design System & Visual Experience:**
   - Current styles need expanded design tokens (radii, elevation, transition timings, focus rings).
   - Component library needs modals/dialogs, toast notifications, progress indicators, stat cards, empty states, and tooltips.
   - Strict WCAG 2.2 AA compliance: keyboard focus traps, aria attributes, high contrast tokens.

3. **Two-Way Communication Flow:**
   - Hearing partners need a quick-response deck, clear large-font live captions, and intuitive speech-to-text toggles.
   - Signers need real-time sentence construction, quick phrase insertion, instant TTS replay, and clear correction mechanisms ("Not what I signed").

4. **Structured Learning & Gamification:**
   - Provide guided learning tracks (Alphabet/Fingerspelling, Numbers, Greetings, Emergency/Medical, Everyday Phrases).
   - Add interactive comprehension quizzes and practice feedback scored against true model confidence.

5. **Local-First Profile & Personalisation:**
   - Offline-capable user profile system (Signer / Learner / Ally mode) with local IndexedDB/localStorage persistence.
   - Comprehensive data privacy controls: one-click data export, zero telemetry, local memory wipe.

---

## 4. Implementation Roadmap

- **Phase 1: Design System & Token Foundation** (`styles.css`, `ui.tsx`)
- **Phase 2: Navigation & Multi-View Architecture** (`SiteHeader.tsx`, `App.tsx`)
- **Phase 3: Two-Way Communication Studio** (`CommunicationStudio.tsx`)
- **Phase 4: Structured ASL Learning & Quiz System** (`LearningCenter.tsx`, `learning-store.ts`)
- **Phase 5: Personal Vocabulary & Flashcards** (`PersonalVocabulary.tsx`)
- **Phase 6: Learning Analytics & Activity Tracker** (`AnalyticsPanel.tsx`)
- **Phase 7: Profile, Accessibility & Privacy Centre** (`ProfileModal.tsx`, `profile-store.ts`, `SettingsPanel.tsx`)
- **Phase 8: Dictionary & Interactive Search Enhancement** (`SignDictionary.tsx`)
- **Phase 9: Quality Assurance & Build Verification** (TypeScript, Vitest, Vite Build, GitHub Actions)
