/**
 * Accessible Toast Notification Store
 * Manages transient alert notifications with auto-dismissal.
 */

export type ToastType = 'info' | 'success' | 'warn' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

class ToastStore {
  private toasts: ToastMessage[] = [];
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getToasts = (): ToastMessage[] => this.toasts;

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullToast: ToastMessage = { ...toast, id };
    this.toasts = [...this.toasts, fullToast];
    this.notify();

    const duration = toast.durationMs ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    return id;
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear(): void {
    this.toasts = [];
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

export const toastStore = new ToastStore();

export function showToast(
  title: string,
  type: ToastType = 'info',
  description?: string,
  durationMs = 4000,
): string {
  const payload: Omit<ToastMessage, 'id'> = {
    title,
    type,
    durationMs,
  };
  if (description !== undefined) {
    payload.description = description;
  }
  return toastStore.show(payload);
}
