import { ReactNode } from 'react';

export interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({
  eyebrow = 'BIBLIOFLIX',
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <section
      className={`flex flex-col items-center justify-center rounded-xl border border-brand-border bg-brand-surface/50 px-6 py-16 text-center ${className}`}
    >
      {eyebrow && (
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-brand-muted">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </section>
  );
}
