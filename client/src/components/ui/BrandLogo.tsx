import { Link } from 'react-router-dom';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark-bg' | 'light-bg';
  to?: string;
  className?: string;
}

const sizeClasses: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function BrandLogo({
  size = 'md',
  tone = 'dark-bg',
  to = '/',
  className = '',
}: BrandLogoProps) {
  const biblioColor = tone === 'dark-bg' ? 'text-white' : 'text-[#090C12]';

  const content = (
    <span
      className={`inline-flex items-center font-extrabold tracking-[-0.04em] select-none ${sizeClasses[size]} ${className}`}
      aria-label="Biblioflix"
    >
      <span className={biblioColor}>biblio</span>
      <span className="text-brand-primary">flix</span>
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="inline-flex items-center rounded-sm">
      {content}
    </Link>
  );
}
