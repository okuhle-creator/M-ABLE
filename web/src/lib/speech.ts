/**
 * Speech Services (Text-to-Speech and Speech-to-Text Captions)
 * Uses native Web Speech APIs with zero external dependencies.
 */

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export async function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) return [];
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length > 0) return voices;

  return new Promise((resolve) => {
    const handler = () => {
      const updated = synth.getVoices();
      synth.removeEventListener('voiceschanged', handler);
      resolve(updated);
    };
    synth.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(synth.getVoices());
    }, 500);
  });
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speak(
  text: string,
  options: {
    rate?: number | undefined;
    pitch?: number | undefined;
    voiceURI?: string | undefined;
    onStart?: (() => void) | undefined;
    onEnd?: (() => void) | undefined;
    onError?: ((err: unknown) => void) | undefined;
  } = {},
): void {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    options.onEnd?.();
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;

  if (options.voiceURI) {
    const voice = synth.getVoices().find((v) => v.voiceURI === options.voiceURI);
    if (voice) utterance.voice = voice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };
  utterance.onend = () => {
    options.onEnd?.();
  };
  utterance.onerror = (e) => {
    options.onError?.(e);
  };

  synth.speak(utterance);
}

// Minimal strongly-typed Web Speech API interfaces
interface SpeechRecognitionResultItem {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorLike {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export interface SpeechRecognizerHandle {
  start: () => void;
  stop: () => void;
  isListening: () => boolean;
}

export function createSpeechRecognizer({
  lang = 'en-US',
  onResult,
  onError,
  onStatusChange,
}: {
  lang?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStatusChange?: (listening: boolean) => void;
}): SpeechRecognizerHandle | null {
  if (!isSpeechRecognitionSupported()) return null;

  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  const RecognitionClass = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  if (!RecognitionClass) return null;

  let recognition: SpeechRecognitionInstance | null = null;
  let listening = false;
  let shouldRestart = false;

  const init = () => {
    recognition = new RecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (!res) continue;
        const item = res[0];
        if (!item) continue;
        if (res.isFinal) {
          final += item.transcript;
        } else {
          interim += item.transcript;
        }
      }
      if (final) {
        onResult(final.trim(), true);
      } else if (interim) {
        onResult(interim.trim(), false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorLike) => {
      if (event.error !== 'no-speech') {
        onError?.(event.error);
      }
    };

    recognition.onend = () => {
      if (shouldRestart && recognition) {
        try {
          recognition.start();
        } catch {
          listening = false;
          onStatusChange?.(false);
        }
      } else {
        listening = false;
        onStatusChange?.(false);
      }
    };
  };

  return {
    start: () => {
      if (listening) return;
      shouldRestart = true;
      if (!recognition) init();
      if (!recognition) return;
      try {
        recognition.start();
        listening = true;
        onStatusChange?.(true);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : String(e));
      }
    },
    stop: () => {
      shouldRestart = false;
      if (recognition && listening) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
      listening = false;
      onStatusChange?.(false);
    },
    isListening: () => listening,
  };
}
