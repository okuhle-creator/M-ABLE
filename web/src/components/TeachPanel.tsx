import { CircleDot, HelpCircle, Info, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import type { Session } from '../app/session';
import { GestureStore } from '../lib/gesture-store';
import type { LoadedModel } from '../ml/model-client';
import {
  MAX_GESTURES,
  MAX_NAME_LENGTH,
  MAX_TAKES,
  MIN_TAKES,
  addTake,
  isReady,
  matchGesture,
  type Gesture,
  type GestureMatch,
} from '../ml/prototypes';
import { Badge, Button, Percent } from './ui';

const store = new GestureStore();

function TakeDots({ count }: { count: number }) {
  return (
    <span className="flex gap-1" aria-hidden>
      {Array.from({ length: MAX_TAKES }, (_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i < count ? 'bg-accent' : i < MIN_TAKES ? 'bg-ink-muted/30' : 'bg-ink-muted/15'
          }`}
        />
      ))}
    </span>
  );
}

export function TeachPanel({ session, model }: { session: Session; model: LoadedModel }) {
  const version = model.meta.version;
  const embeddingDim = model.meta.embeddingDim;
  const [gestures, setGestures] = useState<Gesture[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const [match, setMatch] = useState<GestureMatch | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const inputId = useId();

  useEffect(() => {
    let cancelled = false;
    store
      .load(version, embeddingDim)
      .then(({ gestures: saved, discarded, unreadable }) => {
        if (cancelled) return;
        setGestures(saved);
        const were = (n: number) => `${n} saved gesture${n === 1 ? ' was' : 's were'}`;
        if (discarded) {
          setNotice(
            `${were(discarded)} taught with a different model version and had to be removed.`,
          );
        } else if (unreadable) {
          setNotice(`${were(unreadable)} unreadable and had to be removed.`);
        }
      })
      .catch(() => {
        if (!cancelled)
          setNotice('This browser is blocking storage, so gestures last until you leave the page.');
      });
    return () => {
      cancelled = true;
    };
  }, [version, embeddingDim]);

  const gesturesRef = useRef(gestures);
  useEffect(() => {
    gesturesRef.current = gestures;
  }, [gestures]);

  useEffect(
    () =>
      session.onResult((result) => {
        const embedding = result.inference.embedding;
        const list = gesturesRef.current;
        if (armed) {
          const gesture = list.find((g) => g.id === armed);
          if (!gesture) return;
          const updated = addTake(gesture, embedding);
          const next = list.map((g) => (g.id === armed ? updated : g));
          gesturesRef.current = next;
          setGestures(next);
          void store.save(updated, version).catch(() => undefined);
          const reachedMinimum =
            gesture.takes.length < MIN_TAKES && updated.takes.length >= MIN_TAKES;
          if (reachedMinimum || updated.takes.length >= MAX_TAKES) setArmed(null);
          return;
        }
        setMatch(matchGesture(embedding, list, model.meta.teach));
      }),
    [session, armed, version, model.meta.teach],
  );

  const ready = gestures.filter(isReady);
  const armedGesture = gestures.find((g) => g.id === armed);

  const validate = (trimmed: string): string | null => {
    if (!trimmed) return 'Give the gesture a name.';
    if (trimmed.length > 24) return 'Keep the name under 25 characters.';
    if (gestures.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      return 'You already have a gesture with that name.';
    }
    if (gestures.length >= MAX_GESTURES) return `Up to ${MAX_GESTURES} gestures.`;
    return null;
  };

  const add = (event: SyntheticEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    const problem = validate(trimmed);
    setFormError(problem);
    if (problem) return;
    const gesture: Gesture = { id: crypto.randomUUID(), name: trimmed, takes: [] };
    setGestures((list) => [...list, gesture]);
    void store.save(gesture, version).catch(() => undefined);
    setName('');
    setArmed(gesture.id);
    setMatch(null);
    session.resetRecognition();
  };

  const storageFailed = () => {
    setNotice('This browser refused to update its storage; the change lasts until you leave.');
  };

  const remove = (id: string) => {
    if (armed === id) setArmed(null);
    setMatch(null);
    void store
      .remove(id)
      .catch(storageFailed)
      .finally(() => {
        setGestures((list) => list.filter((g) => g.id !== id));
      });
  };

  const clearAll = () => {
    setArmed(null);
    setMatch(null);
    setConfirmClear(false);
    void store
      .clear()
      .catch(storageFailed)
      .finally(() => {
        setGestures([]);
      });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-muted leading-relaxed">
          Teach M-ABLE custom gestures with {MIN_TAKES}–{MAX_TAKES} camera recordings. Custom
          gestures are matched via nearest-prototype cosine similarity on the model’s
          128-dimensional embedding representation. Stored locally in IndexedDB.
        </p>
      </div>

      {/* Form to add a new custom gesture */}
      <form
        onSubmit={add}
        className="space-y-2 rounded-lg border border-line bg-surface p-4 shadow-sm"
        noValidate
      >
        <div>
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1"
          >
            New gesture
          </label>
          <input
            id={inputId}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. wave, thumbs up, custom salute"
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? `${inputId}-error` : undefined}
            className="h-10 w-full rounded-md border border-line bg-surface-muted/50 px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:bg-surface focus:outline-none"
            disabled={gestures.length >= MAX_GESTURES}
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-ink-subtle">
            {gestures.length}/{MAX_GESTURES} gestures stored
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={gestures.length >= MAX_GESTURES}
            aria-label="Add gesture"
          >
            <Plus aria-hidden className="size-4" />
            Add gesture
          </Button>
        </div>

        {formError ? (
          <p id={`${inputId}-error`} className="text-xs text-danger font-medium">
            {formError}
          </p>
        ) : null}
      </form>

      {/* Status banner (Required by testid) */}
      <div aria-live="polite" data-testid="teach-status">
        {armedGesture ? (
          <div className="rounded-lg border border-accent-border bg-accent-soft p-4 text-sm font-medium text-ink">
            <p className="flex items-center gap-2">
              <CircleDot aria-hidden className="pulse-dot size-4 text-accent" />
              Recording “{armedGesture.name}”: take{' '}
              {Math.min(armedGesture.takes.length + 1, MAX_TAKES)} of{' '}
              {Math.max(MIN_TAKES, armedGesture.takes.length + 1)}
            </p>
            <p className="mt-1.5 text-xs text-ink-muted">
              Make the gesture clearly toward the camera, then lower your hands. The model will
              extract its embedding vector.
            </p>
          </div>
        ) : ready.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-muted">
            Add a gesture and record at least {MIN_TAKES} takes to activate custom recognition.
          </div>
        ) : match === null || match.kind === 'empty' ? (
          <div className="rounded-lg border border-line bg-surface-muted/40 p-4 text-sm text-ink-muted">
            Make one of your custom gestures toward the camera to see it recognised.
          </div>
        ) : match.kind === 'match' ? (
          <div className="rounded-lg border border-success-border bg-success-soft p-4">
            <p className="text-xs font-semibold tracking-wider text-success uppercase">
              Recognised
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
              <Sparkles aria-hidden className="size-5 text-success" />
              {match.gesture.name}
            </p>
            <p className="mt-1 text-xs text-ink-muted font-mono">
              Cosine similarity: <Percent value={match.similarity} />
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface-muted p-4">
            <p className="flex items-center gap-2 text-lg font-semibold text-warn">
              <HelpCircle aria-hidden className="size-5 text-warn" />
              Not sure
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Closest match was “{match.gesture.name}”, but similarity was below the honest
              confidence threshold.
            </p>
          </div>
        )}
      </div>

      {/* Gestures List */}
      {gestures.length > 0 ? (
        <ul
          className="divide-y divide-line rounded-lg border border-line bg-surface shadow-sm overflow-hidden"
          aria-label="Your gestures"
        >
          {gestures.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{g.name}</p>
                  {isReady(g) ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="warn">Needs takes</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                  <TakeDots count={g.takes.length} />
                  <span>
                    {g.takes.length}/{MAX_TAKES} takes{isReady(g) ? '' : ` · needs ${MIN_TAKES}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {g.takes.length < MAX_TAKES && armed !== g.id ? (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      setArmed(g.id);
                      setMatch(null);
                      session.resetRecognition();
                    }}
                  >
                    <CircleDot aria-hidden className="size-3 text-accent" />
                    {isReady(g) ? 'Add take' : 'Record'}
                    <span className="sr-only"> for {g.name}</span>
                  </Button>
                ) : null}

                {armed === g.id ? (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setArmed(null);
                    }}
                  >
                    Stop<span className="sr-only"> recording {g.name}</span>
                  </Button>
                ) : null}

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    remove(g.id);
                  }}
                  aria-label={`Delete ${g.name}`}
                >
                  <Trash2 aria-hidden className="size-3.5 text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Footer & clear actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted pt-2 border-t border-line/60">
        <span>
          {gestures.length}/{MAX_GESTURES} gestures · indexed mathematically as vectors, never video
        </span>
        {gestures.length > 0 ? (
          confirmClear ? (
            <span className="flex items-center gap-1.5">
              <Button size="xs" variant="danger" onClick={clearAll}>
                Delete all
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setConfirmClear(false);
                }}
              >
                Cancel
              </Button>
            </span>
          ) : (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setConfirmClear(true);
              }}
            >
              <Trash2 aria-hidden className="size-3.5" />
              Clear all
            </Button>
          )
        ) : null}
      </div>

      {notice ? <p className="text-xs text-warn">{notice}</p> : null}

      {/* Honest Technical Methodology Disclosure */}
      <div className="rounded-lg border border-line bg-surface-muted/40 p-3.5 text-xs text-ink-muted space-y-1">
        <p className="font-semibold text-ink flex items-center gap-1.5">
          <Info className="size-3.5 text-accent" />
          Technical Integrity Notice
        </p>
        <p className="leading-relaxed">
          Custom signs do not retrain the full neural network. Instead, the model outputs a
          128-dimensional embedding from its penultimate layer, and new inputs are classified via
          cosine distance against your prototypes. Recognition requires distinct, repeatable hand
          configurations.
        </p>
      </div>
    </div>
  );
}
