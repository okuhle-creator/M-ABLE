import { Eye, Info, Trash2, Volume2 } from 'lucide-react';
import { useEffect, useSyncExternalStore, useState } from 'react';
import { historyStore } from '../lib/history-store';
import { settingsStore } from '../lib/settings-store';
import { getVoices, isSpeechSynthesisSupported, speak } from '../lib/speech';
import {
  APP_NAME,
  APP_SUBTITLE,
  APP_TAGLINE,
  DATASET_CREDIT,
  DATASET_URL,
  ORIGINAL_AUTHOR,
  ORIGINAL_PROJECT,
  ORIGINAL_REPO_URL,
  REPO_URL,
} from '../links';
import { Button, Card } from './ui';

export function SettingsPanel() {
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testSpeechPlaying, setTestSpeechPlaying] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);

  useEffect(() => {
    let active = true;
    void getVoices().then((v) => {
      if (active) setVoices(v);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleTestVoice = () => {
    if (testSpeechPlaying) return;
    setTestSpeechPlaying(true);
    speak('Welcome to M-ABLE. Making Every Ability Understood.', {
      rate: settings.ttsRate,
      pitch: settings.ttsPitch,
      voiceURI: settings.ttsVoiceURI || undefined,
      onEnd: () => {
        setTestSpeechPlaying(false);
      },
      onError: () => {
        setTestSpeechPlaying(false);
      },
    });
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        'Clear all local data including communication history and custom taught gestures?',
      )
    ) {
      historyStore.clear();
      settingsStore.reset();
      setDataCleared(true);
      setTimeout(() => {
        setDataCleared(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Settings & Accessibility</h2>
        <p className="mt-1 text-sm text-ink-muted leading-relaxed">
          Customise display, visual comfort, speech synthesis parameters, and data retention
          preferences.
        </p>
      </div>

      {/* Visual & Accessibility Section */}
      <Card className="p-5 space-y-5">
        <div className="border-b border-line pb-3">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Eye className="size-4 text-accent" />
            Display & Accessibility
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Tailor visual density and sensory comfort to your preferences.
          </p>
        </div>

        {/* Theme Preference */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">
            Interface Theme
          </label>
          <div className="grid grid-cols-3 gap-2 sm:max-w-md">
            {(
              [
                ['system', 'System Default'],
                ['light', 'Warm Ivory (Light)'],
                ['dark', 'Charcoal (Dark)'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  settingsStore.update({ theme: val });
                }}
                className={`cursor-pointer rounded-md border p-2.5 text-xs font-medium text-center transition-colors ${
                  settings.theme === val
                    ? 'border-accent bg-accent-soft text-accent font-semibold'
                    : 'border-line bg-surface text-ink hover:bg-surface-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Typography Size */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">
            Text Size
          </label>
          <div className="grid grid-cols-3 gap-2 sm:max-w-md">
            {(
              [
                ['standard', 'Standard (100%)'],
                ['large', 'Large (112%)'],
                ['xlarge', 'Extra Large (125%)'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  settingsStore.update({ textSize: val });
                }}
                className={`cursor-pointer rounded-md border p-2.5 text-xs font-medium text-center transition-colors ${
                  settings.textSize === val
                    ? 'border-accent bg-accent-soft text-accent font-semibold'
                    : 'border-line bg-surface text-ink hover:bg-surface-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          <label className="flex items-center justify-between p-3 rounded-md border border-line bg-surface-muted/30 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-ink">Reduced Motion</p>
              <p className="text-xs text-ink-muted">
                Minimises or disables non-essential animations
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => {
                settingsStore.update({ reducedMotion: e.target.checked });
              }}
              className="size-4 rounded border-line accent-accent cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-md border border-line bg-surface-muted/30 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-ink">High Contrast Mode</p>
              <p className="text-xs text-ink-muted">
                Increases border definition and text contrast
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => {
                settingsStore.update({ highContrast: e.target.checked });
              }}
              className="size-4 rounded border-line accent-accent cursor-pointer"
            />
          </label>
        </div>
      </Card>

      {/* Speech & Audio Settings */}
      <Card className="p-5 space-y-5">
        <div className="border-b border-line pb-3">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Volume2 className="size-4 text-accent" />
            Speech & Audio (Text-to-Speech)
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure the voice output used when reading confirmed sentences aloud.
          </p>
        </div>

        {isSpeechSynthesisSupported() ? (
          <div className="space-y-4">
            {/* Voice Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1.5">
                Synthesis Voice
              </label>
              <select
                aria-label="Speech Synthesis Voice"
                value={settings.ttsVoiceURI}
                onChange={(e) => {
                  settingsStore.update({ ttsVoiceURI: e.target.value });
                }}
                className="w-full max-w-md rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              >
                <option value="">System Default Voice</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders: Rate & Pitch */}
            <div className="grid gap-4 sm:grid-cols-2 max-w-md">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-ink-muted">
                    Speech Rate
                  </span>
                  <span className="font-mono text-ink">{settings.ttsRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={settings.ttsRate}
                  onChange={(e) => {
                    settingsStore.update({ ttsRate: parseFloat(e.target.value) });
                  }}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-ink-muted">
                    Pitch
                  </span>
                  <span className="font-mono text-ink">{settings.ttsPitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={settings.ttsPitch}
                  onChange={(e) => {
                    settingsStore.update({ ttsPitch: parseFloat(e.target.value) });
                  }}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>

            <Button size="sm" variant="secondary" onClick={handleTestVoice}>
              <Volume2 className="size-4 text-accent" />
              {testSpeechPlaying ? 'Playing sample…' : 'Play Voice Sample'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Speech synthesis is not supported in this browser.
          </p>
        )}
      </Card>

      {/* Privacy & Storage */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-line pb-3">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Trash2 className="size-4 text-danger" />
            Privacy & Data Retention
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">Manage your local device data.</p>
        </div>

        <p className="text-xs text-ink-muted leading-relaxed">
          M-ABLE does not collect telemetry, perform remote analytics, or upload camera frames.
          Everything stored on your machine is kept in browser localStorage and IndexedDB.
        </p>

        <div className="pt-2">
          <Button variant="danger" size="sm" onClick={handleClearAllData}>
            Clear All Local Data & Reset Preferences
          </Button>
          {dataCleared ? (
            <p className="mt-2 text-xs text-success font-medium">
              All local history and settings have been reset.
            </p>
          ) : null}
        </div>
      </Card>

      {/* Product Provenance, Architecture & Credits */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-line pb-3">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Info className="size-4 text-accent" />
            About M-ABLE & Provenance
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {APP_TAGLINE} · {APP_SUBTITLE}
          </p>
        </div>

        <div className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            <strong className="text-ink">{APP_NAME}</strong> is an intelligent assistive
            communication platform designed for individuals who communicate via sign language,
            speech therapists, educators, and accessibility practitioners.
          </p>

          <div className="grid gap-2 sm:grid-cols-2 pt-2">
            <div className="rounded-md border border-line bg-surface-muted/40 p-3">
              <p className="font-semibold text-ink">Computer Vision Engine</p>
              <p className="mt-1">
                MediaPipe Holistic Landmarker computing 543 spatial coordinates (face, pose, hands)
                at 30 FPS inside an isolated Web Worker.
              </p>
            </div>

            <div className="rounded-md border border-line bg-surface-muted/40 p-3">
              <p className="font-semibold text-ink">Neural Architecture</p>
              <p className="mt-1">
                1.4M parameter Convolutional + Transformer network executing via ONNX Runtime
                WebAssembly with SIMD acceleration.
              </p>
            </div>
          </div>

          <div className="border-t border-line/60 pt-3">
            <p className="font-semibold text-ink mb-1">Attribution & Academic Lineage</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Original browser AI pipeline developed by{' '}
                <a
                  href={ORIGINAL_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  {ORIGINAL_AUTHOR} ({ORIGINAL_PROJECT})
                </a>{' '}
                under the MIT License.
              </li>
              <li>
                Training Corpus:{' '}
                <a
                  href={DATASET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  {DATASET_CREDIT}
                </a>
                .
              </li>
              <li>
                Repository:{' '}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  {REPO_URL}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
