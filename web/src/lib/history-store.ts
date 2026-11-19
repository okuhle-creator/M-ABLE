/**
 * Communication History Store
 * Privacy-first local storage for confirmed phrases and sentences.
 * Zero telemetry, zero server storage.
 */

export interface HistoryRecord {
  id: string;
  text: string;
  words: string[];
  timestamp: number;
}

const STORAGE_KEY = 'm_able_history_v1';
const MAX_RECORDS = 100;

export class HistoryStore {
  private records: HistoryRecord[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.records = parsed as HistoryRecord[];
        }
      }
    } catch {
      this.records = [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // Storage quota or privacy sandbox restriction
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

  getAll(): HistoryRecord[] {
    return this.records;
  }

  add(text: string, words: string[] = []): HistoryRecord | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const record: HistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      words: words.length > 0 ? words : trimmed.split(/\s+/),
      timestamp: Date.now(),
    };

    // Prepend and truncate to MAX_RECORDS
    this.records = [record, ...this.records].slice(0, MAX_RECORDS);
    this.persist();
    return record;
  }

  remove(id: string): void {
    this.records = this.records.filter((r) => r.id !== id);
    this.persist();
  }

  clear(): void {
    this.records = [];
    this.persist();
  }

  exportJson(): string {
    return JSON.stringify(this.records, null, 2);
  }
}

export const historyStore = new HistoryStore();
