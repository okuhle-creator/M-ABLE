import {
  Copy,
  Delete,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Session, SessionSnapshot } from '../app/session';
import { historyStore } from '../lib/history-store';
import { settingsStore } from '../lib/settings-store';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speak,
  stopSpeaking,
  type SpeechRecognizerHandle,
} from '../lib/speech';
import { showToast } from '../lib/toast-store';
import type { LoadedModel } from '../ml/model-client';
import { Stage } from './Stage';
import { Badge, Button, Card, Percent } from './ui';

const QUICK_PARTNER_RESPONSES = [
  'Yes, absolutely.',
  'No, thank you.',
  'Could you please repeat that?',
  'I understand now.',
  'Nice to meet you!',
  'Please give me a moment.',
  'Can we write this down?',
  'Have a wonderful day!',
];

const QUICK_SIGNER_PHRASES = [
  'Hello',
  'Thank you',
  'Please help',
  'Good morning',
  'I need water',
  'See you later',
];

export function CommunicationStudio({
  session,
  snap,
  model,
}: {
  session: Session;
  snap: SessionSnapshot;
  model: LoadedModel;
}) {
  // Signer side state
  const [signerSentence, setSignerSentence] = useState('');
  const [isSpeakingSigner, setIsSpeakingSigner] = useState(false);
  const [latestSign, setLatestSign] = useState<{ word: string; prob: number } | null>(null);

  // Hearing partner side state
  const [partnerSpeechSupported] = useState(isSpeechRecognitionSupported());
  const [isListeningPartner, setIsListeningPartner] = useState(false);
  const [partnerCaptions, setPartnerCaptions] = useState<string[]>([]);
  const [interimCaption, setInterimCaption] = useState('');
  const [partnerInput, setPartnerInput] = useState('');
  const [isSpeakingPartner, setIsSpeakingPartner] = useState(false);

  const settings = settingsStore.getSnapshot();
  const ttsSupported = isSpeechSynthesisSupported();

  // Listen to recognizer events for signer side
  useEffect(() => {
    return session.onResult((result) => {
      const decision = result.decision;
      if (decision.kind === 'sign' && decision.top[0]) {
        const word = model.labels[decision.top[0].index]?.label;
        if (word) {
          setLatestSign({ word, prob: decision.top[0].probability });
          setSignerSentence((prev) => (prev ? `${prev} ${word}` : word));
        }
      }
    });
  }, [session, model.labels]);

  // Speech Recognition Handle for hearing partner side
  useEffect(() => {
    if (!partnerSpeechSupported) return;

    let handle: SpeechRecognizerHandle | null = null;
    if (isListeningPartner) {
      handle = createSpeechRecognizer({
        lang: settings.captionLang,
        onResult: (transcript, isFinal) => {
          if (isFinal) {
            setPartnerCaptions((prev) => [...prev, transcript].slice(-10));
            setInterimCaption('');
          } else {
            setInterimCaption(transcript);
          }
        },
        onError: (err) => {
          showToast(`Microphone error: ${err}`, 'error');
          setIsListeningPartner(false);
        },
        onStatusChange: (listening) => {
          if (!listening) setIsListeningPartner(false);
        },
      });

      handle?.start();
    }

    return () => {
      handle?.stop();
    };
  }, [isListeningPartner, partnerSpeechSupported, settings.captionLang]);

  // Signer Vocalisation
  const handleVocalizeSigner = () => {
    if (!signerSentence.trim()) return;
    if (isSpeakingSigner) {
      stopSpeaking();
      setIsSpeakingSigner(false);
      return;
    }

    setIsSpeakingSigner(true);
    speak(signerSentence, {
      rate: settings.ttsRate,
      pitch: settings.ttsPitch,
      voiceURI: settings.ttsVoiceURI || undefined,
      onEnd: () => {
        setIsSpeakingSigner(false);
        historyStore.add(signerSentence, signerSentence.trim().split(/\s+/));
        showToast('Sentence vocalized and saved to history', 'success');
      },
      onError: () => {
        setIsSpeakingSigner(false);
      },
    });
  };

  // Partner Response Vocalisation
  const handleVocalizePartner = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    if (isSpeakingPartner) {
      stopSpeaking();
      setIsSpeakingPartner(false);
      return;
    }

    setIsSpeakingPartner(true);
    speak(textToSpeak, {
      rate: settings.ttsRate,
      pitch: settings.ttsPitch,
      onEnd: () => {
        setIsSpeakingPartner(false);
        setPartnerCaptions((prev) => [...prev, `[Spoken]: ${textToSpeak}`].slice(-10));
        setPartnerInput('');
      },
      onError: () => {
        setIsSpeakingPartner(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl flex items-center gap-2.5">
            <MessageSquare className="size-6 text-accent" />
            Two-Way Communication Studio
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Seamless real-time dialogue bridging Deaf signers (Sign → Voice) and hearing partners
            (Voice → Live Captions).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">Bi-Directional Mode Active</Badge>
          <Badge variant="success">100% On-Device Privacy</Badge>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* LEFT COLUMN: SIGNER INTERFACE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="flex size-2.5 rounded-full bg-accent" />
              <h2 className="text-base font-bold text-ink">Signer Perspective (ASL → Speech)</h2>
            </div>
            {latestSign && (
              <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                Last sign: <strong>{latestSign.word}</strong> (<Percent value={latestSign.prob} />)
              </span>
            )}
          </div>

          {/* Camera Stage */}
          <Stage session={session} snap={snap} />

          {/* Quick Phrases for Signer */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1.5">
              Quick Phrases
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SIGNER_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    setSignerSentence((prev) => (prev ? `${prev} ${phrase}` : phrase));
                  }}
                  className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  +{phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Assembled Sentence Box */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Constructed Sentence
              </span>
              <span className="text-xs text-ink-muted">
                {signerSentence.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              value={signerSentence}
              onChange={(e) => {
                setSignerSentence(e.target.value);
              }}
              placeholder="Sign gestures to build your sentence automatically, or type to edit…"
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-surface-muted/30 p-2.5 text-base font-medium text-ink focus:border-accent focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleVocalizeSigner}
                  disabled={!signerSentence.trim() || !ttsSupported}
                >
                  {isSpeakingSigner ? (
                    <>
                      <VolumeX className="size-3.5" /> Stop Speaking
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3.5" /> Vocalize to Partner
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(signerSentence);
                    showToast('Sentence copied to clipboard', 'info');
                  }}
                  disabled={!signerSentence.trim()}
                >
                  <Copy className="size-3.5" /> Copy
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    const words = signerSentence.trim().split(/\s+/);
                    words.pop();
                    setSignerSentence(words.join(' '));
                  }}
                  disabled={!signerSentence.trim()}
                >
                  <Delete className="size-3" /> Undo Word
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSignerSentence('');
                  }}
                  disabled={!signerSentence.trim()}
                >
                  <RotateCcw className="size-3" /> Clear
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: HEARING CONVERSATION PARTNER INTERFACE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="flex size-2.5 rounded-full bg-success" />
              <h2 className="text-base font-bold text-ink">
                Hearing Partner Perspective (Speech → Captions)
              </h2>
            </div>
            <span className="text-xs text-ink-muted">Live Transcription Engine</span>
          </div>

          {/* Partner Speech Input Card */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Microphone Captions</p>
                <p className="text-xs text-ink-muted">
                  Hearing partner speaks while M-ABLE displays live on-screen text.
                </p>
              </div>
              <Button
                variant={isListeningPartner ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  setIsListeningPartner(!isListeningPartner);
                }}
                disabled={!partnerSpeechSupported}
              >
                {isListeningPartner ? (
                  <>
                    <MicOff className="size-4" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="size-4" /> Start Speaking
                  </>
                )}
              </Button>
            </div>

            {/* Captions Display Box (High Contrast) */}
            <div
              className="min-h-56 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface-muted/40 p-4 space-y-2.5 font-sans"
              aria-live="polite"
            >
              {partnerCaptions.length === 0 && !interimCaption ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-ink-muted">
                  <Mic className="size-8 text-line-strong mb-2" />
                  <p className="text-sm font-medium">No spoken dialogue yet.</p>
                  <p className="text-xs mt-0.5">
                    Click &ldquo;Start Speaking&rdquo; to transcribe your voice for the signer.
                  </p>
                </div>
              ) : (
                <>
                  {partnerCaptions.map((cap, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-line/60 bg-surface p-2.5 text-sm font-medium text-ink leading-relaxed"
                    >
                      {cap}
                    </div>
                  ))}
                  {interimCaption && (
                    <div className="rounded-md border border-accent-border/60 bg-accent-soft p-2.5 text-sm font-medium text-accent italic animate-pulse">
                      {interimCaption}…
                    </div>
                  )}
                </>
              )}
            </div>

            {partnerCaptions.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setPartnerCaptions([]);
                  }}
                >
                  <RotateCcw className="size-3" /> Clear Captions
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Response Deck for Hearing Partner */}
          <Card className="p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block">
              Quick Response Deck
            </span>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PARTNER_RESPONSES.map((resp) => (
                <button
                  key={resp}
                  type="button"
                  onClick={() => {
                    handleVocalizePartner(resp);
                  }}
                  className="rounded-md border border-line bg-surface p-2 text-left text-xs font-medium text-ink hover:border-accent hover:bg-accent-soft transition-colors cursor-pointer"
                >
                  {resp}
                </button>
              ))}
            </div>

            {/* Custom Typed Response for Partner */}
            <div className="pt-2 border-t border-line/60 flex gap-2">
              <input
                type="text"
                value={partnerInput}
                onChange={(e) => {
                  setPartnerInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && partnerInput.trim()) {
                    handleVocalizePartner(partnerInput);
                  }
                }}
                placeholder="Or type a custom reply to display and speak…"
                className="flex-1 rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  handleVocalizePartner(partnerInput);
                }}
                disabled={!partnerInput.trim()}
              >
                Send
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
