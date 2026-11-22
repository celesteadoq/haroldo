export type CategoryTintKey =
  | 'romance'
  | 'ficcao-cientifica'
  | 'fantasia'
  | 'suspense'
  | 'terror'
  | 'biografia'
  | 'tecnologia'
  | 'desenvolvimento-pessoal';

const tintClasses: Record<CategoryTintKey, string> = {
  romance: 'bg-[#1D121A]',
  'ficcao-cientifica': 'bg-[#111626]',
  fantasia: 'bg-[#181326]',
  suspense: 'bg-[#0F1E22]',
  terror: 'bg-[#221218]',
  biografia: 'bg-[#1F1A11]',
  tecnologia: 'bg-[#0F1D21]',
  'desenvolvimento-pessoal': 'bg-[#11201A]',
};

export interface CategoryCardProps {
  index: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  onClick?: () => void;
}

export function CategoryCard({
  index,
  name,
  slug,
  description,
  imageUrl,
  onClick,
}: CategoryCardProps) {
  const tint = tintClasses[slug as CategoryTintKey] ?? 'bg-brand-surface';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-brand-border p-5 text-left transition-all duration-150 hover:border-gray-600 ${tint}`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15 transition-opacity group-hover:opacity-25"
        />
      )}
      <div className="relative flex items-center justify-between text-xs text-brand-muted">
        <span className="font-mono">{String(index).padStart(2, '0')}</span>
        <span
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        >
          ↗
        </span>
      </div>
      <div className="relative mt-6">
        <h3 className="text-base sm:text-lg font-bold text-white">{name}</h3>
        {description && <p className="mt-1 text-xs text-brand-muted">{description}</p>}
      </div>
    </button>
  );
}
