import { Check, Copy, CornerDownLeft, Delete, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { historyStore } from '../lib/history-store';
import { settingsStore } from '../lib/settings-store';
import { isSpeechSynthesisSupported, speak, stopSpeaking } from '../lib/speech';
import { Button } from './ui';

export function SentenceBuilder({
  sentence,
  onChange,
  onUndo,
  onClear,
}: {
  sentence: string;
  onChange: (val: string) => void;
  onUndo: () => void;
  onClear: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const settings = settingsStore.getSnapshot();

  const handleSpeak = () => {
    if (!sentence.trim()) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(sentence, {
      rate: settings.ttsRate,
      pitch: settings.ttsPitch,
      voiceURI: settings.ttsVoiceURI || undefined,
      onStart: () => {
        setSpeaking(true);
      },
      onEnd: () => {
        setSpeaking(false);
      },
      onError: () => {
        setSpeaking(false);
      },
    });
    // Auto-save confirmed spoken phrase to history
    historyStore.add(sentence);
  };

  const handleCopy = async () => {
    if (!sentence.trim()) return;
    try {
      await navigator.clipboard.writeText(sentence);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const handleAddToken = (token: string) => {
    if (token === 'SPACE') {
      onChange(sentence ? `${sentence} ` : '');
    } else {
      const trimmed = sentence.trimEnd();
      onChange(trimmed ? `${trimmed}${token} ` : token);
    }
  };

  const ttsAvailable = isSpeechSynthesisSupported();

  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <label
          htmlFor="sentence-input"
          className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
        >
          Sentence Builder
        </label>
        <span className="text-xs text-ink-subtle">
          {sentence.trim() ? `${sentence.trim().split(/\s+/).length} words` : '0 words'}
        </span>
      </div>

      <div className="relative">
        <textarea
          id="sentence-input"
          rows={3}
          value={sentence}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value);
          }}
          placeholder="Recognised signs assemble here. You can also type or edit directly..."
          className="w-full resize-none rounded-md border border-line bg-surface-muted/60 px-3 py-2.5 text-base font-normal text-ink placeholder:text-ink-subtle focus:border-accent focus:bg-surface focus:outline-none transition-colors"
        />
      </div>

      {/* Punctuation & space helpers */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-ink-subtle mr-1">Quick tokens:</span>
        {['.', ',', '?', '!', 'and', 'the', 'please'].map((tok) => (
          <button
            key={tok}
            type="button"
            onClick={() => {
              handleAddToken(tok);
            }}
            className="cursor-pointer rounded border border-line bg-surface px-2 py-0.5 font-mono text-ink-muted hover:border-line-strong hover:bg-surface-muted transition-colors"
          >
            {tok}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            handleAddToken('SPACE');
          }}
          className="cursor-pointer rounded border border-line bg-surface px-2 py-0.5 text-ink-muted hover:border-line-strong hover:bg-surface-muted transition-colors"
        >
          Space ␣
        </button>
      </div>

      {/* Sentence Builder Actions */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line/60">
        <div className="flex flex-wrap items-center gap-2">
          {ttsAvailable ? (
            <Button
              variant={speaking ? 'danger' : 'primary'}
              size="sm"
              onClick={handleSpeak}
              disabled={!sentence.trim()}
              title="Speak sentence aloud via Text-to-Speech"
            >
              {speaking ? (
                <>
                  <VolumeX aria-hidden className="size-4" />
                  Stop Voice
                </>
              ) : (
                <>
                  <Volume2 aria-hidden className="size-4" />
                  Speak Text
                </>
              )}
            </Button>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void handleCopy();
            }}
            disabled={!sentence.trim()}
            title="Copy sentence to clipboard"
          >
            {copied ? (
              <>
                <Check aria-hidden className="size-3.5 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy aria-hidden className="size-3.5" />
                Copy
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (sentence.trim()) historyStore.add(sentence);
            }}
            disabled={!sentence.trim()}
            title="Save this sentence to communication history"
          >
            <CornerDownLeft aria-hidden className="size-3.5" />
            Save to History
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!sentence.trim()}
            title="Undo last added word"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!sentence}
            title="Clear sentence buffer"
          >
            <Delete aria-hidden className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
