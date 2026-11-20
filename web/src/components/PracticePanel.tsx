import { ArrowRight, Calendar, CheckCircle2, ExternalLink, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Session } from '../app/session';
import { practiceScore } from '../ml/decision';
import { dictionaryUrl } from '../ml/meta';
import type { LoadedModel } from '../ml/model-client';
import { Badge, Button, Percent } from './ui';

interface Attempt {
  id: number;
  score: number;
  sawIndex: number | null;
  partial: boolean;
}

const CATEGORIES: Record<string, string[]> = {
  All: [],
  'Greetings & Essentials': [
    'hello',
    'bye',
    'please',
    'thankyou',
    'yes',
    'no',
    'wait',
    'friend',
    'happy',
    'sad',
  ],
  'Family & People': [
    'mom',
    'dad',
    'brother',
    'sister',
    'grandfather',
    'grandmother',
    'baby',
    'boy',
    'girl',
    'man',
    'woman',
  ],
  'Actions & Verbs': [
    'go',
    'come',
    'eat',
    'drink',
    'sleep',
    'play',
    'read',
    'write',
    'hear',
    'see',
    'give',
    'look',
    'make',
  ],
  'Animals & Nature': [
    'animal',
    'bird',
    'cat',
    'dog',
    'fish',
    'horse',
    'flower',
    'tree',
    'sun',
    'rain',
    'water',
  ],
  'Everyday Objects': [
    'bed',
    'car',
    'chair',
    'table',
    'phone',
    'book',
    'shirt',
    'shoes',
    'door',
    'window',
    'clock',
    'TV',
  ],
};

function pick(indices: number[], not: number | null): number {
  const pool = indices.length > 1 ? indices.filter((i) => i !== not) : indices;
  return pool[Math.floor(Math.random() * pool.length)] ?? 0;
}

export function PracticePanel({
  session,
  model,
  initialTarget,
}: {
  session: Session;
  model: LoadedModel;
  initialTarget?: number | undefined;
}) {
  const { labels, meta } = model;
  const shipped = useMemo(() => labels.filter((l) => l.shipped).map((l) => l.index), [labels]);

  // Sign of the day: deterministic hash based on UTC date
  const signOfTheDayIndex = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
    }
    return shipped[hash % shipped.length] ?? 0;
  }, [shipped]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [target, setTarget] = useState(() => initialTarget ?? pick(shipped, null));
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [tries, setTries] = useState(0);

  // Practice session progress
  const [passedCount, setPassedCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Filter pool by category
  const activePool = useMemo(() => {
    if (selectedCategory === 'All') return shipped;
    const catWords = CATEGORIES[selectedCategory] ?? [];
    const filtered = shipped.filter((idx) => {
      const lbl = labels[idx]?.label.toLowerCase() ?? '';
      return catWords.includes(lbl);
    });
    return filtered.length > 0 ? filtered : shipped;
  }, [selectedCategory, shipped, labels]);

  useEffect(() => {
    return session.onResult((result, id) => {
      const score = practiceScore(
        result.inference.logits,
        labels.map((l) => l.shipped),
        target,
        meta.calibration,
      );
      const best = result.decision.top[0];
      const isPass = !result.partial && score >= meta.calibration.notSureBelow;

      setAttempt({
        id,
        score,
        sawIndex: result.decision.kind === 'sign' && best ? best.index : null,
        partial: result.partial,
      });
      setTries((n) => n + 1);
      setTotalAttempts((n) => n + 1);
      if (isPass) {
        setPassedCount((n) => n + 1);
      }
    });
  }, [session, labels, meta.calibration, target]);

  const sign = labels[target];
  if (!sign) return null;
  const passed =
    attempt !== null && !attempt.partial && attempt.score >= meta.calibration.notSureBelow;

  const next = () => {
    setTarget((t) => pick(activePool, t));
    setAttempt(null);
    setTries(0);
    session.resetRecognition();
  };

  const loadSignOfTheDay = () => {
    setTarget(signOfTheDayIndex);
    setAttempt(null);
    setTries(0);
    session.resetRecognition();
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    const catWords = CATEGORIES[cat] ?? [];
    const pool =
      cat === 'All'
        ? shipped
        : shipped.filter((idx) => catWords.includes(labels[idx]?.label.toLowerCase() ?? ''));
    if (pool.length > 0) {
      setTarget(pick(pool, null));
      setAttempt(null);
      setTries(0);
      session.resetRecognition();
    }
  };

  return (
    <div className="space-y-5">
      {/* Sign of the Day Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-border/60 bg-accent-soft/50 p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-ink">
            <Calendar className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Sign of the Day
              </span>
              <span className="text-xs text-ink-subtle">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-base font-semibold text-ink">{labels[signOfTheDayIndex]?.label}</p>
          </div>
        </div>
        {target !== signOfTheDayIndex ? (
          <Button size="xs" variant="primary" onClick={loadSignOfTheDay}>
            Practise Today’s Sign
          </Button>
        ) : (
          <Badge variant="accent">Practising Today’s Sign</Badge>
        )}
      </div>

      {/* Category Pills */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1.5">
          Curated Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(CATEGORIES).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                handleCategorySelect(cat);
              }}
              className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-surface text-ink-muted hover:bg-surface-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Target Sign Card */}
      <div className="rounded-lg border border-line bg-surface-muted/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wider text-ink-subtle uppercase">
            Sign this
          </p>
          {sign.heldOutTop1 !== null ? (
            <span className="text-xs font-mono text-ink-subtle">
              Model accuracy: <Percent value={sign.heldOutTop1} />
            </span>
          ) : null}
        </div>

        <p
          className="mt-1 text-3xl font-bold tracking-tight text-ink"
          data-testid="practice-target"
        >
          {sign.label}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <a
            href={dictionaryUrl(sign)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-muted transition-colors shadow-sm"
          >
            How to sign it
            <ExternalLink aria-hidden className="size-3.5 text-ink-muted" />
            <span className="sr-only">(opens an ASL dictionary in a new tab)</span>
          </a>
          <Button size="sm" variant="secondary" onClick={next}>
            <Shuffle aria-hidden className="size-4 text-ink-muted" />
            Another sign
          </Button>
        </div>
      </div>

      {/* Attempt Feedback & Score Box */}
      <div aria-live="polite" data-testid="practice-score">
        {attempt === null ? (
          <div className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-muted">
            <p>Sign to your camera (or replay a clip) to get a score.</p>
          </div>
        ) : (
          <div
            className={`rounded-lg border p-4 transition-colors ${
              passed ? 'border-success-border bg-success-soft' : 'border-line bg-surface'
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-ink flex items-center gap-2">
                {passed ? <CheckCircle2 className="size-4 text-success inline" /> : null}
                {attempt.partial
                  ? 'Move back so your shoulders are in view'
                  : passed
                    ? `That looked like “${sign.label}”`
                    : 'Not quite yet — keep trying'}
              </p>
              <p className="text-2xl font-bold font-mono">
                <Percent value={attempt.score} />
              </p>
            </div>
            <div aria-hidden className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  passed ? 'bg-success' : 'bg-accent'
                }`}
                style={{ width: `${Math.max(3, Math.round(attempt.score * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {attempt.sawIndex !== null && attempt.sawIndex !== target
                ? `Closest recognition: “${labels[attempt.sawIndex]?.label ?? '?'}”. `
                : ''}
              Attempt {tries}.
            </p>
            {passed ? (
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={next}>
                  Next sign
                  <ArrowRight aria-hidden className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Progress & Session Summary */}
      <div className="grid grid-cols-3 gap-2 border-t border-line/60 pt-3 text-center">
        <div className="rounded-md border border-line bg-surface p-2">
          <p className="text-xs text-ink-muted">Completed</p>
          <p className="text-lg font-bold font-mono text-success">{passedCount}</p>
        </div>
        <div className="rounded-md border border-line bg-surface p-2">
          <p className="text-xs text-ink-muted">Attempts</p>
          <p className="text-lg font-bold font-mono text-ink">{totalAttempts}</p>
        </div>
        <div className="rounded-md border border-line bg-surface p-2">
          <p className="text-xs text-ink-muted">Accuracy</p>
          <p className="text-lg font-bold font-mono text-accent">
            {totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
