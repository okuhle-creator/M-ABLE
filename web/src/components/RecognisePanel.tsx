import { Check, HelpCircle, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Session, SessionSnapshot } from '../app/session';
import type { Decision } from '../ml/decision';
import type { LoadedModel } from '../ml/model-client';
import { ConversationCaptions } from './ConversationCaptions';
import { GuessList } from './GuessList';
import { SentenceBuilder } from './SentenceBuilder';
import { Button, Percent } from './ui';

interface HistoryEntry {
  id: number;
  decision: Decision;
}

const HISTORY = 8;
const HIGH_CONFIDENCE_THRESHOLD = 0.7;

function notSureText(decision: Decision): string {
  if (decision.reason === 'partial')
    return 'Move back so your shoulders are in view, then sign again.';
  return 'None of the shipped signs fit well enough to name one. Try again, a little slower.';
}

export function RecognisePanel({
  session,
  snap,
  model,
}: {
  session: Session;
  snap: SessionSnapshot;
  model: LoadedModel;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sentence, setSentence] = useState<string>('');
  const [historyTokens, setHistoryTokens] = useState<string[]>([]);
  const [autoAddHighConfidence, setAutoAddHighConfidence] = useState(false);
  const [pendingWord, setPendingWord] = useState<string | null>(null);

  useEffect(() => {
    return session.onResult((result, id) => {
      const decision = result.decision;
      setHistory((h) => [{ id, decision }, ...h].slice(0, HISTORY));

      if (decision.kind === 'sign' && decision.top[0]) {
        const word = model.labels[decision.top[0].index]?.label;
        if (word) {
          if (autoAddHighConfidence && decision.top[0].probability >= HIGH_CONFIDENCE_THRESHOLD) {
            setSentence((prev) => (prev ? `${prev} ${word}` : word));
            setHistoryTokens((prev) => [...prev, word]);
            setPendingWord(null);
          } else {
            setPendingWord(word);
          }
        }
      }
    });
  }, [session, model.labels, autoAddHighConfidence]);

  const latest = history[0];
  const labels = model.labels;
  const shipped = labels.filter((l) => l.shipped).length;
  const decision = latest?.decision;
  const top = decision?.top[0];

  const handleAddWord = (word: string) => {
    setSentence((prev) => (prev ? `${prev} ${word}` : word));
    setHistoryTokens((prev) => [...prev, word]);
    setPendingWord(null);
  };

  const handleUndo = () => {
    if (historyTokens.length > 0) {
      const remaining = historyTokens.slice(0, -1);
      setHistoryTokens(remaining);
      setSentence(remaining.join(' '));
    } else {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 0) {
        words.pop();
        setSentence(words.join(' '));
      }
    }
  };

  const handleClear = () => {
    setSentence('');
    setHistoryTokens([]);
    setPendingWord(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-muted leading-relaxed">
          Recognising {shipped} isolated American Sign Language signs on-device. Sign clearly and
          lower your hands to finish each gesture.
        </p>
      </div>

      {/* Primary Recognition Result Box */}
      <div
        className="rounded-lg border border-line bg-surface-muted/60 p-4 transition-colors"
        aria-live="polite"
        data-testid="recognise-result"
      >
        {snap.signing ? (
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-accent">
            <span aria-hidden className="pulse-dot size-2 rounded-full bg-accent" />
            Reading your sign…
          </p>
        ) : null}
        {!decision && snap.signing ? null : !decision ? (
          <p className="text-sm text-ink-muted">Your result appears here after each sign.</p>
        ) : decision.kind === 'sign' && top ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-ink-subtle uppercase">
                You signed
              </span>
              <span className="text-xs font-mono text-ink-muted">
                <Percent value={top.probability} /> confident
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-3xl font-bold tracking-tight text-ink">
                {labels[top.index]?.label}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleAddWord(labels[top.index]?.label ?? '');
                }}
                title="Add this confirmed sign to the sentence builder"
              >
                <Plus aria-hidden className="size-3.5" />
                Add to Sentence
              </Button>
            </div>
            {top.probability < HIGH_CONFIDENCE_THRESHOLD ? (
              <p className="mt-2 text-xs text-ink-muted bg-surface p-2 rounded border border-line">
                Moderate confidence. Confirm this matches your intended sign or select an
                alternative from Top Guesses below.
              </p>
            ) : null}
          </div>
        ) : decision.kind === 'not-sure' ? (
          <div>
            <p className="flex items-center gap-2 text-xl font-semibold tracking-tight text-warn">
              <HelpCircle aria-hidden className="size-5" />
              Not sure
            </p>
            <p className="mt-1 text-sm text-ink-muted">{notSureText(decision)}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Nothing to read in that clip.</p>
        )}
      </div>

      {/* Sentence Builder */}
      <SentenceBuilder
        sentence={sentence}
        onChange={setSentence}
        onUndo={handleUndo}
        onClear={handleClear}
      />

      {/* Pending Confirmation Prompt if user has an uncertain unadded sign */}
      {pendingWord && !sentence.endsWith(pendingWord) ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-accent-border bg-accent-soft p-3 text-xs">
          <span className="text-ink">
            Add <strong>“{pendingWord}”</strong> to current sentence?
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              variant="primary"
              onClick={() => {
                handleAddWord(pendingWord);
              }}
            >
              <Check className="size-3" />
              Confirm Add
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setPendingWord(null);
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {/* Top Guesses List */}
      {decision && decision.top.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Top Guesses
            </h3>
            <span className="text-xs text-ink-subtle">Click a guess to insert</span>
          </div>
          <GuessList guesses={decision.top} labels={labels} muted={decision.kind !== 'sign'} />
        </div>
      ) : null}

      {/* Recent Signs Stream (Required by e2e/unit tests) */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Recent Signs
          </h3>
          <label className="inline-flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoAddHighConfidence}
              onChange={(e) => {
                setAutoAddHighConfidence(e.target.checked);
              }}
              className="rounded border-line accent-accent"
            />
            <span>Auto-add high confidence</span>
          </label>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">None yet.</p>
        ) : (
          <ol
            className="flex gap-2 overflow-x-auto pb-1"
            aria-label="Recent signs"
            data-testid="history"
          >
            {history.map((entry) => {
              const best = entry.decision.top[0];
              const named = entry.decision.kind === 'sign' && best;
              const wordLabel = named ? labels[best.index]?.label : null;
              return (
                <li
                  key={entry.id}
                  className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    named
                      ? 'border-accent-border bg-accent-soft text-accent cursor-pointer hover:bg-accent-hover hover:text-white'
                      : 'border-line bg-surface-muted text-ink-muted'
                  }`}
                  onClick={() => {
                    if (wordLabel) handleAddWord(wordLabel);
                  }}
                  title={wordLabel ? `Click to add ${wordLabel} to sentence` : undefined}
                >
                  {wordLabel ?? 'Not sure'}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Real-Time Speech-to-Text Captions */}
      <ConversationCaptions />
    </div>
  );
}
