import { ProgressBar } from '../ui/ProgressBar';
import { BookCover } from './BookCover';

export interface ProgressBookCardProps {
  title: string;
  author?: string;
  coverUrl?: string | null;
  progressPercentage: number;
  subtitle?: string;
  ctaLabel?: string;
  onContinueReading?: () => void;
}

export function ProgressBookCard({
  title,
  author,
  coverUrl,
  progressPercentage,
  subtitle,
  ctaLabel = 'Retomar leitura →',
  onContinueReading,
}: ProgressBookCardProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(progressPercentage)));

  return (
    <article className="flex items-center gap-4 rounded-xl border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-borderInput">
      <BookCover src={coverUrl} title={title} author={author} size="sm" className="shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h3 className="truncate text-sm sm:text-base font-bold text-white">{title}</h3>
          <p className="truncate text-xs text-brand-muted">
            {author ? `${author} • ` : ''}
            {safePercent}% concluído{subtitle ? ` • ${subtitle}` : ''}
          </p>
        </div>
        <ProgressBar value={safePercent} />
        <button
          type="button"
          onClick={onContinueReading}
          className="inline-flex items-center text-xs font-semibold text-brand-accent hover:text-brand-primary transition-colors"
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}
