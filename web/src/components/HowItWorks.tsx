import { Boxes, BrainCircuit, Gauge, ScanLine, ShieldCheck } from 'lucide-react';
import type { ModelState } from '../app/session';
import { DATASET_CREDIT, DATASET_URL } from '../links';
import { Card } from './ui';

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function HowItWorks({ model }: { model: ModelState }) {
  const meta = model.status === 'ready' ? model.model.meta : null;
  const lips = meta?.featureSet !== 'hands_pose';
  const steps = [
    {
      icon: ScanLine,
      title: 'Landmarks',
      body: lips
        ? 'MediaPipe Holistic extracts 543 body, face and hand points in each camera frame, executed within an isolated Web Worker.'
        : 'MediaPipe hand and pose landmarkers track the hands and upper torso in each frame via a Web Worker.',
    },
    {
      icon: Boxes,
      title: 'Normalisation',
      body: `Hands and shoulders${lips ? ', and 40 lip points' : ''} are centred on the shoulders, normalised by shoulder span, and mirrored so signing hands standardise predictably. Frames resample at ${meta?.fps ?? 30} FPS.`,
    },
    {
      icon: BrainCircuit,
      title: 'Neural Network',
      body: `A compact 1.4M-parameter convolutional + transformer network processes up to ${meta?.maxFrames ?? 64} frames. Executes in ONNX Runtime WebAssembly with SIMD acceleration.`,
    },
    {
      icon: Gauge,
      title: 'Honest Calibration',
      body: 'Empirical confidence thresholds calibrated on held-out signers ensure M-ABLE returns “Not sure” rather than hallucinating low-probability guesses.',
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="mt-16 scroll-mt-6 border-t border-line pt-10"
    >
      <div className="max-w-3xl">
        <h2 id="how-heading" className="text-2xl font-bold tracking-tight text-ink">
          How M-ABLE Recognises Sign Language
        </h2>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Signs are decoded from kinematic landmarks rather than raw pixel matrices. This ensures
          invariant performance across diverse skin tones, lighting conditions, and camera hardware,
          while keeping the neural footprint light enough to execute locally on standard consumer
          devices.
        </p>
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Card className="h-full p-5 bg-surface">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-md bg-accent-soft text-accent">
                  <step.icon aria-hidden className="size-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Phase {i + 1}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{step.body}</p>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5 bg-surface">
          <h3 className="font-semibold text-ink">Empirical Held-Out Validation</h3>
          {meta?.metrics ? (
            <p className="mt-1 text-xs text-ink-muted">
              Evaluated on {meta.metrics.testClips.toLocaleString('en')} independent test sequences
              from signers completely held out during training.
            </p>
          ) : null}
          {meta?.metrics ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ['Top-1 (all signs)', pct(meta.metrics.top1)],
                ['Top-5 (all signs)', pct(meta.metrics.top5)],
                meta.metrics.shippedSigns === meta.classes
                  ? ['Top-3 (all signs)', pct(meta.metrics.shippedTop3)]
                  : [`Top-1 (${meta.metrics.shippedSigns} shipped)`, pct(meta.metrics.shippedTop1)],
                ['Custom Few-Shot (8-way, 3 takes)', pct(meta.metrics.teachAccuracy)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-line bg-surface-muted/50 p-3">
                  <dt className="text-xs text-ink-muted">{k}</dt>
                  <dd className="mt-1 text-xl font-bold font-mono text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Benchmark metrics are loaded directly from the model metadata export.
            </p>
          )}
          <p className="mt-4 text-xs text-ink-muted border-t border-line/60 pt-3">
            Corpus:{' '}
            <a
              href={DATASET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline hover:text-accent-hover font-medium"
            >
              {DATASET_CREDIT}
            </a>
          </p>
        </Card>

        <Card className="p-5 bg-surface">
          <h3 className="font-semibold text-ink">On-Device Privacy & Security</h3>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            Assistive communication often occurs in private personal, medical, or educational
            spaces. M-ABLE is engineered so that no visual sensor data is ever transmitted over the
            network.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-ink-muted">
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-accent shrink-0 mt-0.5" />
              <span>
                Camera frames are processed in-memory and discarded immediately after landmark
                extraction.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-accent shrink-0 mt-0.5" />
              <span>
                Strict Content Security Policy (CSP) restricts network requests strictly to
                same-origin asset loading.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-accent shrink-0 mt-0.5" />
              <span>
                Custom gestures and transcripts persist exclusively in your local browser sandbox.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
