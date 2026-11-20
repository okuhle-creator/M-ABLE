import { ArrowRight, Camera, Cpu, GraduationCap, Lock, MessageSquare } from 'lucide-react';
import type { ModelState } from '../app/session';
import {
  DATASET_CREDIT,
  DATASET_URL,
  ORIGINAL_AUTHOR,
  ORIGINAL_PROJECT,
  ORIGINAL_REPO_URL,
} from '../links';
import type { ActiveView } from './SiteHeader';
import { Badge, Button, Card } from './ui';

export function OverviewPanel({
  modelState,
  onNavigate,
}: {
  modelState: ModelState;
  onNavigate: (view: ActiveView) => void;
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
          Making Ability Accessible.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          M-ABLE is an intelligent assistive communication ecosystem bridging American Sign Language
          and spoken conversation. With real-time computer vision and neural inference running 100%
          on-device in your browser, dialogue is responsive, dignified, and strictly confidential.
        </p>

        {/* Value proposition badges */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-ink-muted">
          {[
            { icon: Lock, text: 'Zero cloud video streaming — 100% on-device privacy' },
            { icon: Cpu, text: 'WebAssembly SIMD accelerated neural inference' },
            { icon: MessageSquare, text: 'Two-way text-to-speech & live conversation captions' },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 shadow-xs"
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
              onNavigate('studio');
            }}
          >
            <MessageSquare className="size-5" />
            Launch Two-Way Studio
            <ArrowRight className="size-4 ml-1" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              onNavigate('live');
            }}
          >
            <Camera className="size-5 text-accent" />
            Isolated Sign Recognition
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              onNavigate('learn');
            }}
          >
            <GraduationCap className="size-5 text-ink-muted" />
            ASL Learning Centre
          </Button>
        </div>
      </div>

      {/* Core Technical Highlights Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'ASL Vocabulary',
            value: `${shippedCount} Signs`,
            detail: 'Verified isolated American Sign Language classes',
          },
          {
            label: 'Landmark Topology',
            value: '543 Points',
            detail: 'MediaPipe Holistic face mesh, hands & pose',
          },
          {
            label: 'Inference Latency',
            value: '< 25 ms',
            detail: 'Zero cloud latency; on-device WASM SIMD',
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

      {/* Modular Product Architecture Navigation */}
      <div>
        <div className="border-b border-line pb-2 mb-4">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Assistive Technology Modules
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Engineered for fluid everyday communication, active learning, and accessibility
            research.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Two-Way Communication Studio',
              desc: 'Dedicated split-screen dialogue: Deaf signers sign to speak aloud; hearing partners speak to generate live high-contrast captions.',
              action: () => {
                onNavigate('studio');
              },
              btnText: 'Open Studio',
            },
            {
              title: 'Live Isolated Recognition',
              desc: 'High-framerate camera tracking, top-3 predictions, honest "Not sure" calibration, editable sentence builder, and audio replay.',
              action: () => {
                onNavigate('live');
              },
              btnText: 'Open Recognition',
            },
            {
              title: 'ASL Learning Centre',
              desc: 'Curated vocabulary tracks (Greetings, Emergency, Family, Everyday), daily Sign of the Day, and webcam practice scored against neural logits.',
              action: () => {
                onNavigate('learn');
              },
              btnText: 'Start Learning',
            },
            {
              title: 'Personal Vocabulary & Flashcards',
              desc: 'Bookmark key signs, review with interactive flip flashcards, and access custom taught gestures persisted locally.',
              action: () => {
                onNavigate('vocabulary');
              },
              btnText: 'Open Vocabulary',
            },
            {
              title: 'Sign Dictionary',
              desc: 'Searchable 250-sign index with held-out model accuracy ratings, alphabet filters, and direct links to verified reference clips.',
              action: () => {
                onNavigate('dictionary');
              },
              btnText: 'Browse Dictionary',
            },
            {
              title: 'Progress & Learning Analytics',
              desc: 'Objective mastery metrics, category completion rates, daily streak counts, and conversation volume history.',
              action: () => {
                onNavigate('analytics');
              },
              btnText: 'View Insights',
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

      {/* Honest Capability Boundary Note */}
      <Card className="p-5 border-warn-border bg-warn-soft/40">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <span>Scope of Artificial Intelligence in M-ABLE</span>
        </h3>
        <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
          M-ABLE recognizes <strong>isolated</strong> sign language gestures from a verified
          250-class vocabulary. It is not a continuous natural ASL grammatical translator and does
          not replace human certified ASL interpreters. Signs are calibrated to display &ldquo;Not
          sure&rdquo; rather than outputting confident false labels when movement is ambiguous.
        </p>
      </Card>

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
          (MIT License). Neural weights were trained on the{' '}
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
