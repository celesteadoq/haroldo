import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';

export type FooterVariant = 'full' | 'minimal' | 'none';

export interface FooterProps {
  variant?: FooterVariant;
}

export function Footer({ variant = 'minimal' }: FooterProps) {
  if (variant === 'none') return null;

  if (variant === 'minimal') {
    return (
      <footer className="border-t border-brand-border bg-brand-bg py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-brand-subtle sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Biblioflix</p>
          <div className="flex items-center gap-6">
            <a href="https://openlibrary.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Capas: Open Library</a>
            <Link to="/ajuda" className="hover:text-white transition-colors">
              Ajuda
            </Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-brand-border bg-brand-bg pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 pb-8 border-b border-brand-border md:flex-row md:items-center">
          <div>
            <BrandLogo size="md" />
            <p className="mt-2 text-xs text-brand-muted">
              Para quem vive mil vidas em uma só.
            </p>
          </div>
          <nav aria-label="Links institucionais" className="flex flex-wrap gap-6 text-xs text-brand-muted">
            <Link to="/sobre" className="hover:text-white transition-colors">
              Sobre
            </Link>
            <Link to="/ajuda" className="hover:text-white transition-colors">
              Ajuda
            </Link>
            <Link to="/planos" className="hover:text-white transition-colors">
              Planos
            </Link>
            <Link to="/termos" className="hover:text-white transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-brand-subtle sm:flex-row sm:items-center">
          <p>
            © 2026 Biblioflix. Todos os direitos reservados. <a href="https://openlibrary.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Capas: Open Library</a>
          </p>
          <div className="flex items-center gap-5">
            <span className="text-brand-muted">Instagram ↗</span>
            <span className="text-brand-muted">Facebook ↗</span>
            <span className="text-brand-muted">YouTube ↗</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
