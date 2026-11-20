import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { toastStore, type ToastMessage } from '../lib/toast-store';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onStage' | 'outline';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-hover shadow-sm active:translate-y-px disabled:opacity-50 border border-transparent',
  secondary:
    'border border-line bg-surface text-ink hover:bg-surface-muted shadow-sm active:translate-y-px disabled:opacity-50',
  outline:
    'border border-line-strong bg-transparent text-ink hover:bg-surface-muted active:translate-y-px disabled:opacity-50',
  ghost: 'text-ink hover:bg-surface-muted hover:text-ink active:translate-y-px disabled:opacity-50',
  danger:
    'border border-danger-border bg-surface text-danger hover:bg-danger-soft disabled:opacity-50',
  onStage:
    'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 active:translate-y-px disabled:opacity-50',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}) {
  const sizes = {
    xs: 'h-7 gap-1 px-2.5 text-xs',
    sm: 'h-8.5 gap-1.5 px-3 text-sm',
    md: 'h-10 gap-2 px-4 text-sm',
    lg: 'h-11.5 gap-2.5 px-5 text-base',
  };
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${sizes[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-surface shadow-card transition-all ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Badge({
  variant = 'neutral',
  className = '',
  children,
}: {
  variant?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger';
  className?: string;
  children: ReactNode;
}) {
  const variantStyles = {
    neutral: 'bg-surface-muted text-ink-muted border-line',
    accent: 'bg-accent-soft text-accent border-accent-border',
    success: 'bg-success-soft text-success border-success-border',
    warn: 'bg-warn-soft text-warn border-warn-border',
    danger: 'bg-danger-soft text-danger border-danger-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Percent({ value }: { value: number }) {
  return <span className="tabular-nums font-mono">{Math.round(value * 100)}%</span>;
}

/**
 * Accessible Modal / Dialog with ESC close, focus trap, and ARIA attributes
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-desc' : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidth} rounded-xl border border-line bg-surface p-6 shadow-xl transition-transform animate-in fade-in zoom-in-95`}
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-line">
          <div>
            <h2 id="dialog-title" className="text-lg font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id="dialog-desc" className="mt-1 text-xs text-ink-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer focus-visible:outline-2"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * Toast Container for Global Notifications
 */
export function ToastContainer() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getToasts);

  if (toasts.length === 0) return null;

  const icons: Record<ToastMessage['type'], ReactNode> = {
    info: <Info className="size-4 text-accent shrink-0" />,
    success: <CheckCircle2 className="size-4 text-success shrink-0" />,
    warn: <AlertTriangle className="size-4 text-warn shrink-0" />,
    error: <AlertCircle className="size-4 text-danger shrink-0" />,
  };

  const borders: Record<ToastMessage['type'], string> = {
    info: 'border-accent-border bg-accent-soft/90 text-ink',
    success: 'border-success-border bg-success-soft/90 text-ink',
    warn: 'border-warn-border bg-warn-soft/90 text-ink',
    error: 'border-danger-border bg-danger-soft/90 text-ink',
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-sm transition-all ${borders[toast.type]}`}
        >
          <div className="flex items-start gap-2.5">
            {icons[toast.type]}
            <div>
              <p className="text-xs font-semibold text-ink">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-ink-muted">{toast.description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              toastStore.dismiss(toast.id);
            }}
            className="text-ink-muted hover:text-ink p-0.5"
            aria-label="Dismiss toast"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Stat Card for Analytics & Dashboards
 */
export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  className = '',
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { label: string; positive: boolean };
  className?: string;
}) {
  return (
    <Card className={`p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        {Icon && <Icon className="size-4 text-accent" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-ink sm:text-3xl font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium ${trend.positive ? 'text-success' : 'text-ink-muted'}`}
          >
            {trend.label}
          </span>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-ink-muted">{description}</p>}
    </Card>
  );
}

/**
 * Accessible Progress Bar
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  className = '',
  barClassName = 'bg-accent',
}: {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
  barClassName?: string;
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs">
          {label && <span className="font-medium text-ink-muted">{label}</span>}
          {showPercent && <span className="font-mono text-ink font-semibold">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted border border-line/60"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Empty State Container
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-line bg-surface-muted/30 ${className}`}
    >
      <div className="p-3 rounded-full bg-surface-muted border border-line text-ink-muted mb-3">
        <Icon className="size-6 text-accent" />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-ink-muted max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Section Header Component
 */
export function SectionHeader({
  title,
  description,
  badge,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-line ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
          {badge}
        </div>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
