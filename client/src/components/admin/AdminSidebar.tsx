import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';

export interface AdminNavItem {
  label: string;
  to: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Visão geral', to: '/admin' },
  { label: 'Livros', to: '/admin/livros' },
  { label: 'Autores', to: '/admin/autores' },
  { label: 'Categorias', to: '/admin/categorias' },
  { label: 'Usuários', to: '/admin/usuarios' },
  { label: 'Planos', to: '/admin/planos' },
  { label: 'Assinaturas', to: '/admin/assinaturas' },
  { label: 'Pagamentos', to: '/admin/pagamentos' },
  { label: 'Central de ajuda', to: '/admin/ajuda' },
  { label: 'Auditoria', to: '/admin/auditoria' },
];

export interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/admin'
      ? location.pathname === '/admin'
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const navList = (
    <nav aria-label="Menu administrativo" className="space-y-1.5">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={`flex h-10 items-center rounded-lg px-3.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-primary text-white font-semibold'
                : 'text-brand-muted hover:bg-brand-elevated hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-brand-border bg-brand-surface p-5">
        <div className="mb-6">
          <BrandLogo size="md" to="/admin" />
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
            PAINEL ADMINISTRATIVO
          </p>
        </div>
        {navList}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm lg:hidden"
          role="presentation"
          onClick={onCloseMobile}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navegação administrativa"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-72 flex-col border-r border-brand-border bg-brand-surface p-5 overflow-y-auto"
          >
            <div className="mb-6 flex items-center justify-between">
              <BrandLogo size="sm" to="/admin" />
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded border border-brand-borderInput px-2 py-1 text-xs text-brand-muted hover:text-white"
              >
                Fechar ×
              </button>
            </div>
            {navList}
          </aside>
        </div>
      )}
    </>
  );
}
