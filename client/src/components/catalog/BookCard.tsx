import { Badge } from '../ui/Badge';
import { BookCover } from './BookCover';

export interface BookCardProps {
  title: string;
  author: string;
  category: string;
  coverUrl?: string | null;
  averageRating?: number | null;
  rankNumber?: number;
  availabilityLabel?: string;
  isFreeEligible?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
}

export function BookCard({
  title,
  author,
  category,
  coverUrl,
  averageRating,
  rankNumber,
  availabilityLabel,
  isFreeEligible = false,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: BookCardProps) {
  const badgeText = availabilityLabel ?? (isFreeEligible ? 'Gratuito' : 'Premium');

  return (
    <article className="group flex flex-col">
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          className="block w-full text-left rounded-lg overflow-hidden transition-transform duration-200 group-hover:-translate-y-1"
        >
          <BookCover src={coverUrl} title={title} author={author} />
        </button>

        {typeof rankNumber === 'number' && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md border border-white/15 bg-brand-bg/90 px-2 py-0.5 text-xs font-bold text-white">
            {String(rankNumber).padStart(2, '0')}
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Salvar ${title} nos favoritos`}
            aria-pressed={isFavorite}
            className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
              isFavorite
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-white/15 bg-brand-bg/80 text-white hover:border-brand-primary'
            }`}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {isFavorite ? '♥' : '♡'}
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-white group-hover:text-brand-accent transition-colors">
          {title}
        </h3>
        <p className="truncate text-xs sm:text-sm text-brand-muted">{author}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-brand-muted">
          <div className="flex items-center gap-1.5 truncate">
            {typeof averageRating === 'number' && averageRating > 0 && (
              <>
                <span className="text-brand-gold font-semibold">
                  ★ {averageRating.toFixed(1).replace('.', ',')}
                </span>
                <span aria-hidden="true">•</span>
              </>
            )}
            <span className="truncate">{category}</span>
          </div>
          <Badge variant={isFreeEligible ? 'success' : 'neutral'}>{badgeText}</Badge>
        </div>
      </div>
    </article>
  );
}
