/**
 * Settings and Accessibility Store
 * Persists preferences in localStorage and applies DOM attributes.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type TextSizePreference = 'standard' | 'large' | 'xlarge';

export interface SettingsState {
  theme: ThemePreference;
  textSize: TextSizePreference;
  reducedMotion: boolean;
  highContrast: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoiceURI: string;
  enableCaptions: boolean;
  captionLang: string;
}

const STORAGE_KEY = 'm_able_settings_v1';

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'system',
  textSize: 'standard',
  reducedMotion: false,
  highContrast: false,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoiceURI: '',
  enableCaptions: false,
  captionLang: 'en-US',
};

export class SettingsStore {
  private state: SettingsState = { ...DEFAULT_SETTINGS };
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
    this.applyToDOM();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.state = { ...DEFAULT_SETTINGS, ...(parsed as Partial<SettingsState>) };
        }
      }
    } catch {
      this.state = { ...DEFAULT_SETTINGS };
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage restricted
    }
    this.applyToDOM();
    this.notify();
  }

  private applyToDOM(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Theme
    if (this.state.theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', this.state.theme);
    }

    // Text size
    root.setAttribute('data-text-size', this.state.textSize);

    // Reduced motion
    if (this.state.reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }

    // High contrast
    if (this.state.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): SettingsState => this.state;

  update(patch: Partial<SettingsState>): void {
    this.state = { ...this.state, ...patch };
    this.persist();
  }

  reset(): void {
    this.state = { ...DEFAULT_SETTINGS };
    this.persist();
  }
}

export const settingsStore = new SettingsStore();
