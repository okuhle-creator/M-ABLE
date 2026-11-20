import { Cpu, Lock, MessageSquare } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import type { Session } from './app/session';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { CommunicationStudio } from './components/CommunicationStudio';
import { HistoryPanel } from './components/HistoryPanel';
import { HowItWorks } from './components/HowItWorks';
import { LearningCenter } from './components/LearningCenter';
import { ModeTabs, type Mode } from './components/ModeTabs';
import { ModelGate } from './components/ModelGate';
import { OverviewPanel } from './components/OverviewPanel';
import { PersonalVocabulary } from './components/PersonalVocabulary';
import { PracticePanel } from './components/PracticePanel';
import { PreviewNotice } from './components/PreviewNotice';
import { RecognisePanel } from './components/RecognisePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SignDictionary } from './components/SignDictionary';
import { SiteHeader, type ActiveView } from './components/SiteHeader';
import { Stage } from './components/Stage';
import { TeachPanel } from './components/TeachPanel';
import { Card, ToastContainer } from './components/ui';
import {
  APP_NAME,
  APP_SUBTITLE,
  APP_TAGLINE,
  DATASET_URL,
  ORIGINAL_AUTHOR,
  ORIGINAL_PROJECT,
  ORIGINAL_REPO_URL,
  REPO_URL,
} from './links';

export function App({ session }: { session: Session }) {
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [mode, setMode] = useState<Mode>('recognise');
  const [practiceTarget, setPracticeTarget] = useState<number | undefined>(undefined);

  const model = snap.model;
  const untrained = model.status === 'ready' && model.model.meta.metrics === null;
  const shipped =
    model.status === 'ready' ? model.model.labels.filter((l) => l.shipped).length : null;

  const changeMode = (next: Mode) => {
    setMode(next);
    session.resetRecognition();
  };

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    session.resetRecognition();
  };

  const handlePracticeSpecificSign = (index: number) => {
    setPracticeTarget(index);
    setMode('practice');
    setActiveView('live');
    session.resetRecognition();
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <SiteHeader activeView={activeView} onChangeView={handleNavigate} modelState={model} />

      {untrained ? <PreviewNotice /> : null}

      <main id="main" className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* VIEW 1: OVERVIEW */}
        {activeView === 'overview' && (
          <div className="space-y-12">
            <OverviewPanel modelState={model} onNavigate={handleNavigate} />
            <HowItWorks model={model} />
          </div>
        )}

        {/* VIEW 2: TWO-WAY COMMUNICATION STUDIO */}
        {activeView === 'studio' && (
          <ModelGate
            state={model}
            onRetry={() => {
              void session.loadModel();
            }}
          >
            {(loaded) => <CommunicationStudio session={session} snap={snap} model={loaded} />}
          </ModelGate>
        )}

        {/* VIEW 3: LIVE RECOGNITION STUDIO (Isolated Signs & Teach Mode) */}
        {activeView === 'live' && (
          <div>
            <div className="max-w-3xl mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-4xl">
                Sign to your camera
              </h1>
              <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-ink-muted">
                {mode === 'recognise'
                  ? `On-device isolated ASL sign recognition with sentence builder, text-to-speech, and live captions across ${shipped ?? 250} supported signs.`
                  : mode === 'practice'
                    ? 'Guided sign language practice with real-time feedback scored directly against model confidence.'
                    : 'Teach M-ABLE custom gestures using few-shot prototype embeddings. Saved locally.'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-ink-muted">
                <span className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2.5 py-1">
                  <Lock className="size-3 text-accent" />
                  Video remains strictly on device
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2.5 py-1">
                  <Cpu className="size-3 text-accent" />
                  WASM SIMD local inference
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2.5 py-1">
                  <MessageSquare className="size-3 text-accent" />
                  Text-to-Speech & Captions enabled
                </span>
              </div>
            </div>

            <div
              id="demo"
              className="grid scroll-mt-4 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start"
            >
              {/* Left Column: Camera and Landmark Stage */}
              <Stage session={session} snap={snap} />

              {/* Right Column: Mode Tabs and Interactive Panel */}
              <Card className="min-w-0 p-4 sm:p-5">
                <ModeTabs mode={mode} onChange={changeMode} />

                <div
                  role="tabpanel"
                  id={`panel-${mode}`}
                  aria-labelledby={`tab-${mode}`}
                  tabIndex={0}
                  className="mt-4 focus-visible:outline-offset-4"
                >
                  <ModelGate
                    state={model}
                    onRetry={() => {
                      void session.loadModel();
                    }}
                  >
                    {(loaded) =>
                      mode === 'recognise' ? (
                        <RecognisePanel session={session} snap={snap} model={loaded} />
                      ) : mode === 'practice' ? (
                        <PracticePanel
                          session={session}
                          model={loaded}
                          initialTarget={practiceTarget}
                        />
                      ) : (
                        <TeachPanel session={session} model={loaded} />
                      )
                    }
                  </ModelGate>

                  {snap.inferenceError ? (
                    <p role="alert" className="mt-4 text-xs text-danger font-medium">
                      Inference exception: {snap.inferenceError}
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>

            <HowItWorks model={model} />
          </div>
        )}

        {/* VIEW 4: ASL LEARNING CENTRE */}
        {activeView === 'learn' && (
          <ModelGate
            state={model}
            onRetry={() => {
              void session.loadModel();
            }}
          >
            {(loaded) => (
              <LearningCenter
                labels={loaded.labels}
                onLaunchPractice={handlePracticeSpecificSign}
              />
            )}
          </ModelGate>
        )}

        {/* VIEW 5: PERSONAL VOCABULARY & FLASHCARDS */}
        {activeView === 'vocabulary' && (
          <ModelGate
            state={model}
            onRetry={() => {
              void session.loadModel();
            }}
          >
            {(loaded) => (
              <PersonalVocabulary
                labels={loaded.labels}
                onPracticeSign={handlePracticeSpecificSign}
              />
            )}
          </ModelGate>
        )}

        {/* VIEW 6: SIGN DICTIONARY */}
        {activeView === 'dictionary' && (
          <ModelGate
            state={model}
            onRetry={() => {
              void session.loadModel();
            }}
          >
            {(loaded) => (
              <SignDictionary labels={loaded.labels} onPracticeSign={handlePracticeSpecificSign} />
            )}
          </ModelGate>
        )}

        {/* VIEW 7: LEARNING ANALYTICS */}
        {activeView === 'analytics' && (
          <ModelGate
            state={model}
            onRetry={() => {
              void session.loadModel();
            }}
          >
            {(loaded) => <AnalyticsPanel labels={loaded.labels} />}
          </ModelGate>
        )}

        {/* VIEW 8: COMMUNICATION HISTORY */}
        {activeView === 'history' && <HistoryPanel />}

        {/* VIEW 9: SETTINGS & ACCESSIBILITY */}
        {activeView === 'settings' && <SettingsPanel />}
      </main>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Editorial Understated Footer */}
      <footer className="mt-auto border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-ink">
              {APP_NAME} · {APP_TAGLINE}
            </p>
            <p className="mt-0.5 text-ink-subtle">{APP_SUBTITLE}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink underline underline-offset-2"
            >
              GitHub Repository
            </a>
            <span>·</span>
            <span>
              AI pipeline based on{' '}
              <a
                href={ORIGINAL_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink underline underline-offset-2"
              >
                {ORIGINAL_PROJECT} by {ORIGINAL_AUTHOR}
              </a>
            </span>
            <span>·</span>
            <a
              href={DATASET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink underline underline-offset-2"
            >
              Kaggle asl-signs (CC BY 4.0)
            </a>
            <span>·</span>
            <span>MIT Licence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
