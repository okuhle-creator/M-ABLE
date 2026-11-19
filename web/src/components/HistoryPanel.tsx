import { Check, Clock, Copy, Download, FileText, ShieldCheck, Trash2, Volume2 } from 'lucide-react';
import { useSyncExternalStore, useState } from 'react';
import { historyStore } from '../lib/history-store';
import { settingsStore } from '../lib/settings-store';
import { isSpeechSynthesisSupported, speak } from '../lib/speech';
import { Button } from './ui';

export function HistoryPanel() {
  const records = useSyncExternalStore(historyStore.subscribe, () => historyStore.getAll());
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const settings = settingsStore.getSnapshot();
  const ttsAvailable = isSpeechSynthesisSupported();

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      // ignore
    }
  };

  const handleSpeak = (text: string) => {
    speak(text, {
      rate: settings.ttsRate,
      pitch: settings.ttsPitch,
      voiceURI: settings.ttsVoiceURI || undefined,
    });
  };

  const handleExportJson = () => {
    const data = historyStore.exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `m-able-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const text = records
      .map((r) => `[${new Date(r.timestamp).toLocaleString()}] ${r.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `m-able-transcripts-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Communication History</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Confirmed phrases and speech transcripts saved during your communication sessions.
          </p>
        </div>

        {records.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline" onClick={handleExportText}>
              <FileText className="size-3.5" />
              Export TXT
            </Button>
            <Button size="xs" variant="outline" onClick={handleExportJson}>
              <Download className="size-3.5" />
              Export JSON
            </Button>
          </div>
        ) : null}
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-muted/60 p-4 text-xs text-ink-muted leading-relaxed">
        <ShieldCheck className="size-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-ink">Local Privacy Guarantee</p>
          <p className="mt-0.5">
            Communication records are saved strictly inside your browser’s local storage on this
            computer. M-ABLE never transmits transcripts, video footage, audio, or biometric
            landmark data to any remote server.
          </p>
        </div>
      </div>

      {/* Records Stream */}
      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-12 text-center text-sm text-ink-muted">
          <Clock className="size-8 mx-auto mb-2 text-ink-subtle opacity-60" />
          <p className="font-medium text-ink">No history logged yet</p>
          <p className="mt-1 text-xs text-ink-muted">
            Sentences confirmed or spoken aloud in Live Communication will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <span>{records.length} saved entries</span>
            {confirmClear ? (
              <span className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="danger"
                  onClick={() => {
                    historyStore.clear();
                    setConfirmClear(false);
                  }}
                >
                  Confirm Delete All
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
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(true);
                }}
                className="cursor-pointer text-danger hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" />
                Clear All History
              </button>
            )}
          </div>

          <div className="divide-y divide-line rounded-lg border border-line bg-surface shadow-sm overflow-hidden">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-ink leading-snug">{rec.text}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-subtle">
                    <span>
                      {new Date(rec.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(rec.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>·</span>
                    <span>{rec.words.length} words</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {ttsAvailable ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        handleSpeak(rec.text);
                      }}
                      title="Speak phrase aloud"
                    >
                      <Volume2 className="size-3.5 text-accent" />
                      Speak
                    </Button>
                  ) : null}

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      void handleCopy(rec.id, rec.text);
                    }}
                    title="Copy phrase"
                  >
                    {copiedId === rec.id ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5 text-ink-muted" />
                    )}
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      historyStore.remove(rec.id);
                    }}
                    title="Delete record"
                  >
                    <Trash2 className="size-3.5 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
