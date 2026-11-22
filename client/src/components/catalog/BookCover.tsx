import { useState } from 'react';

export interface BookCoverProps {
  src?: string | null;
  title: string;
  author?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeWidths: Record<NonNullable<BookCoverProps['size']>, string> = {
  sm: 'w-16',
  md: 'w-full',
  lg: 'w-full max-w-[260px]',
};

export function BookCover({
  src,
  title,
  author,
  size = 'md',
  className = '',
}: BookCoverProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const showImage = Boolean(src && !hasError);

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-lg border border-brand-border bg-brand-stage ${sizeWidths[size]} ${className}`}
    >
      {showImage ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-brand-elevated" aria-hidden="true" />
          )}
          <img
            src={src ?? ''}
            alt={`Capa do livro ${title}`}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`h-full w-full object-cover transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-[#16272B] via-brand-surface to-brand-bg p-3.5 text-left">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-accent">
            Biblioflix
          </span>
          <div>
            <p className="line-clamp-3 text-sm font-bold leading-snug text-white">{title}</p>
            {author && <p className="mt-1 truncate text-xs text-brand-muted">{author}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
