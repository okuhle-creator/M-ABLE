/**
 * User Profile & Local Privacy Management Store
 * Zero cloud dependency — all persona and session data stored in browser localStorage.
 */

export type UserPersona = 'signer' | 'learner' | 'clinician' | 'guest';
export type PrimaryMode = 'two-way' | 'sign-focused' | 'captions-focused';

export interface UserProfile {
  id: string;
  name: string;
  persona: UserPersona;
  primaryMode: PrimaryMode;
  notes: string;
  createdDate: string;
}

const STORAGE_KEY = 'm_able_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: 'M-ABLE User',
  persona: 'signer',
  primaryMode: 'two-way',
  notes: '',
  createdDate: new Date().toISOString().slice(0, 10),
};

export class ProfileStore {
  private profile: UserProfile = { ...DEFAULT_PROFILE };
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        this.profile = { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {
      this.profile = { ...DEFAULT_PROFILE };
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Storage restricted
    }
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): UserProfile => this.profile;

  update(patch: Partial<UserProfile>): void {
    this.profile = { ...this.profile, ...patch };
    this.persist();
  }

  reset(): void {
    this.profile = { ...DEFAULT_PROFILE };
    this.persist();
  }

  exportAllData(): string {
    const backup = {
      profile: this.profile,
      settings: localStorage.getItem('m_able_settings_v1'),
      learning: localStorage.getItem('m_able_learning_v1'),
      exportDate: new Date().toISOString(),
      platform: 'M-ABLE Intelligent Assistive Communication',
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  }
}

export const profileStore = new ProfileStore();
