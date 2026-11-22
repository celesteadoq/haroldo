export interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'cover';
  className?: string;
}

export function Skeleton({ variant = 'line', className = '' }: SkeletonProps) {
  const base = 'animate-pulse bg-brand-elevated';

  if (variant === 'circle') {
    return <div className={`${base} h-10 w-10 rounded-full ${className}`} aria-hidden="true" />;
  }

  if (variant === 'cover') {
    return <div className={`${base} aspect-[2/3] w-full rounded-lg ${className}`} aria-hidden="true" />;
  }

  if (variant === 'card') {
    return (
      <div
        className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3"
        aria-hidden="true"
      >
        <div className={`${base} aspect-[2/3] w-full rounded-lg`} />
        <div className={`${base} h-4 w-3/4 rounded`} />
        <div className={`${base} h-3 w-1/2 rounded`} />
      </div>
    );
  }

  return <div className={`${base} h-4 w-full rounded ${className}`} aria-hidden="true" />;
}
