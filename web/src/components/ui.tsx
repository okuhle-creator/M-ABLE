import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

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
