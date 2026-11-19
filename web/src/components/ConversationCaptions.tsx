import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { settingsStore } from '../lib/settings-store';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  type SpeechRecognizerHandle,
} from '../lib/speech';
import { Button } from './ui';

export function ConversationCaptions() {
  const [supported] = useState(isSpeechRecognitionSupported());
  const [listening, setListening] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [interim, setInterim] = useState<string>('');
  const recognizerRef = useRef<SpeechRecognizerHandle | null>(null);
  const settings = settingsStore.getSnapshot();

  useEffect(() => {
    if (!supported) return;

    const handle = createSpeechRecognizer({
      lang: settings.captionLang || 'en-US',
      onResult: (text, isFinal) => {
        if (isFinal) {
          setCaptions((prev) => [...prev.slice(-4), text]);
          setInterim('');
        } else {
          setInterim(text);
        }
      },
      onStatusChange: (status) => {
        setListening(status);
      },
    });

    recognizerRef.current = handle;

    return () => {
      handle?.stop();
    };
  }, [supported, settings.captionLang]);

  const toggleListening = () => {
    if (!recognizerRef.current) return;
    if (listening) {
      recognizerRef.current.stop();
    } else {
      recognizerRef.current.start();
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Conversation Captions (Speech-to-Text)
          </h3>
        </div>

        {supported ? (
          <Button variant={listening ? 'danger' : 'outline'} size="xs" onClick={toggleListening}>
            {listening ? (
              <>
                <MicOff className="size-3 text-danger" />
                Stop Captions
              </>
            ) : (
              <>
                <Mic className="size-3 text-accent" />
                Listen to Partner
              </>
            )}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-ink-muted mb-3 leading-relaxed">
        Enable microphone captions for a two-way conversation: your partner speaks, and real-time
        text appears below.
      </p>

      {!supported ? (
        <div className="rounded-md border border-line bg-surface-muted/60 p-3 text-xs text-ink-muted">
          Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari
          for live speech captions.
        </div>
      ) : listening ? (
        <div className="min-h-16 rounded-md border border-accent-border bg-accent-soft/30 p-3 text-sm flex flex-col justify-end">
          <div className="flex items-center gap-2 text-xs font-medium text-accent mb-2">
            <span className="pulse-dot size-2 rounded-full bg-accent" />
            Listening to conversation partner...
          </div>
          {captions.length === 0 && !interim ? (
            <p className="text-xs italic text-ink-subtle">Waiting for speech...</p>
          ) : (
            <div className="space-y-1">
              {captions.map((c, i) => (
                <p key={i} className="text-ink">
                  {c}
                </p>
              ))}
              {interim ? <p className="text-ink-muted italic">{interim}…</p> : null}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-line bg-surface-muted/40 p-3 text-xs text-ink-subtle">
          Captions are paused. Click <strong>Listen to Partner</strong> to transcribe speech from
          anyone speaking near your microphone.
        </div>
      )}
    </div>
  );
}
