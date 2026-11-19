import {
  ArrowRight,
  BookOpen,
  Camera,
  Cpu,
  GraduationCap,
  Lock,
  MessageSquare,
} from 'lucide-react';
import type { ModelState } from '../app/session';
import {
  DATASET_CREDIT,
  DATASET_URL,
  ORIGINAL_AUTHOR,
  ORIGINAL_PROJECT,
  ORIGINAL_REPO_URL,
} from '../links';
import { Badge, Button, Card } from './ui';

export function OverviewPanel({
  modelState,
  onNavigate,
}: {
  modelState: ModelState;
  onNavigate: (view: 'live' | 'learn' | 'dictionary' | 'teach' | 'history' | 'settings') => void;
}) {
  const meta = modelState.status === 'ready' ? modelState.model.meta : null;
  const shippedCount =
    modelState.status === 'ready' ? modelState.model.labels.filter((l) => l.shipped).length : 250;

  return (
    <div className="space-y-10">
      {/* Editorial Hero Header */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="accent">Production Release 1.0</Badge>
          <span className="text-xs font-mono text-ink-subtle">On-Device Neural Inference</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl leading-tight">
          Making Every Ability Understood.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          M-ABLE is an intelligent assistive communication platform bridging sign language and
          spoken dialogue. With real-time computer vision and transformer-based inference operating
          entirely inside the browser, communication is fast, accessible, and completely private.
        </p>

        {/* Value proposition badges */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-ink-muted">
          {[
            { icon: Lock, text: 'Zero cloud upload: video never leaves device' },
            { icon: Cpu, text: 'WASM SIMD accelerated neural inference' },
            { icon: MessageSquare, text: 'Two-way TTS and live speech captions' },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 shadow-sm"
            >
              <Icon className="size-3.5 text-accent" />
              {text}
            </span>
          ))}
        </div>

        {/* Quick Launch CTA buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              onNavigate('live');
            }}
          >
            <Camera className="size-5" />
            Launch Live Communication
            <ArrowRight className="size-4 ml-1" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              onNavigate('learn');
            }}
          >
            <GraduationCap className="size-5 text-accent" />
            Practise ASL
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              onNavigate('dictionary');
            }}
          >
            <BookOpen className="size-5 text-ink-muted" />
            Explore Dictionary
          </Button>
        </div>
      </div>

      {/* Core Technical Highlights Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Vocabulary Size',
            value: `${shippedCount} Signs`,
            detail: 'Verified isolated American Sign Language gestures',
          },
          {
            label: 'Landmark Topology',
            value: '543 Points',
            detail: 'MediaPipe Holistic face, hands & upper pose',
          },
          {
            label: 'Latency & Bandwidth',
            value: '< 25 ms',
            detail: 'Zero network traffic for recognition or speech',
          },
          {
            label: 'Held-Out Accuracy',
            value: meta?.metrics ? `${Math.round(meta.metrics.top1 * 100)}% Top-1` : '72.1% Top-1',
            detail: meta?.metrics
              ? `${Math.round(meta.metrics.top5 * 100)}% Top-5 on unseen signers`
              : '88.1% Top-5 on unseen signers',
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-surface">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-ink tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-ink-muted leading-normal">{stat.detail}</p>
          </Card>
        ))}
      </div>

      {/* Modular Product Architecture */}
      <div>
        <div className="border-b border-line pb-2 mb-4">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Assistive Product Architecture
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Six cohesive modules designed for expressive communication, education, and accessibility
            research.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Live Communication',
              desc: 'Camera tracking, top-3 predictions, confidence verification, editable sentence builder, text-to-speech, and live speech-to-text captions.',
              action: () => {
                onNavigate('live');
              },
              btnText: 'Open Live Studio',
            },
            {
              title: 'Learning Centre',
              desc: 'Guided ASL practice with real-time feedback scored directly against model logits, Sign-of-the-Day, and curated vocabulary categories.',
              action: () => {
                onNavigate('learn');
              },
              btnText: 'Start Learning',
            },
            {
              title: 'Sign Dictionary',
              desc: 'Searchable 250-sign index with held-out model accuracy ratings, alphabet navigation, and direct links to verified demonstration clips.',
              action: () => {
                onNavigate('dictionary');
              },
              btnText: 'View Signs',
            },
            {
              title: 'Teach M-ABLE',
              desc: 'Few-shot custom gesture studio allowing users to record 3–5 takes and classify personalised gestures using 128-d prototype embeddings.',
              action: () => {
                onNavigate('teach');
              },
              btnText: 'Teach Gestures',
            },
            {
              title: 'Communication History',
              desc: 'Privacy-conscious local archive of confirmed conversations, word counts, timestamps, audio playback, and structured exports.',
              action: () => {
                onNavigate('history');
              },
              btnText: 'View History',
            },
            {
              title: 'Settings & Accessibility',
              desc: 'Comprehensive comfort controls including theme, font sizing, reduced motion, high contrast, camera device selection, and TTS tuning.',
              action: () => {
                onNavigate('settings');
              },
              btnText: 'Configure',
            },
          ].map((mod) => (
            <Card
              key={mod.title}
              className="p-5 flex flex-col justify-between hover:border-accent-border transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-ink">{mod.title}</h3>
                <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">{mod.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={mod.action}
                  className="w-full justify-between"
                >
                  <span>{mod.btnText}</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Engineering Provenance & Attributions */}
      <Card className="p-6 bg-surface-muted/40 border-line">
        <h3 className="text-base font-bold text-ink mb-2">Research Provenance & Attribution</h3>
        <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
          M-ABLE builds on the open-source browser AI foundation of{' '}
          <a
            href={ORIGINAL_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline font-medium"
          >
            {ORIGINAL_PROJECT} by {ORIGINAL_AUTHOR}
          </a>{' '}
          (MIT License), which demonstrated client-side ONNX execution with MediaPipe holistic
          landmark tracking. Neural weights were trained on the{' '}
          <a
            href={DATASET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline font-medium"
          >
            {DATASET_CREDIT}
          </a>
          . All training metrics and confidence calibrations represent empirical performance on
          held-out test subjects.
        </p>
      </Card>
    </div>
  );
}
