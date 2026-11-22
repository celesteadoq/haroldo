import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  adminName?: string;
  onOpenMobileSidebar: () => void;
}

export function AdminHeader({
  title,
  subtitle,
  adminName = 'Administrador',
  onOpenMobileSidebar,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border bg-brand-bg/95 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir menu administrativo"
          className="inline-flex h-9 items-center rounded-md border border-brand-borderInput bg-brand-surface px-3 text-xs font-medium text-white lg:hidden"
        >
          Menu ≡
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-brand-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="primary">ADMIN</Badge>
        <span className="hidden sm:inline text-xs font-medium text-brand-muted">{adminName}</span>
        <Link to="/">
          <Button variant="outline" size="sm">
            Ver plataforma
          </Button>
        </Link>
      </div>
    </header>
  );
}
