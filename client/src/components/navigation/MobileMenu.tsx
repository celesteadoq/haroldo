import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';
import type { NavbarAuthState } from './Navbar';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  authState?: NavbarAuthState;
  onLogout?: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  authState = 'visitor',
  onLogout,
}: MobileMenuProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links =
    authState === 'visitor'
      ? [
          { label: 'Início', to: '/' },
          { label: 'Explorar', to: '/catalogo' },
          { label: 'Categorias', to: '/categorias' },
          { label: 'Planos', to: '/planos' },
          { label: 'Ajuda', to: '/ajuda' },
          { label: 'Entrar', to: '/entrar' },
          { label: 'Criar conta grátis', to: '/cadastro' },
        ]
      : [
          { label: 'Início', to: '/' },
          { label: 'Explorar', to: '/catalogo' },
          { label: 'Categorias', to: '/categorias' },
          { label: 'Minha biblioteca', to: '/biblioteca' },
          { label: 'Favoritos', to: '/favoritos' },
          { label: 'Histórico', to: '/historico' },
          { label: 'Meu perfil', to: '/minha-conta' },
          { label: 'Planos e assinatura', to: '/minha-assinatura' },
          { label: 'Notificações', to: '/notificacoes' },
          { label: 'Ajuda', to: '/ajuda' },
          ...(authState === 'admin' ? [{ label: 'Administração', to: '/admin' }] : []),
        ];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm lg:hidden"
      role="presentation"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu Biblioflix"
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-in flex h-full w-full max-w-xs flex-col border-l border-brand-border bg-brand-bg p-5 overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <BrandLogo size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-md border border-brand-borderInput bg-brand-surface px-2.5 py-1 text-xs font-medium text-white"
          >
            Fechar ×
          </button>
        </div>

        <p className="mt-5 text-lg font-bold text-white">Seu universo Biblioflix</p>

        <nav aria-label="Menu móvel" className="mt-4 flex flex-col gap-2.5">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex h-11 items-center justify-center rounded-lg border border-brand-borderInput bg-brand-surface px-4 text-sm font-medium text-white hover:border-brand-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {authState !== 'visitor' && onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="mt-2 flex h-11 items-center justify-center rounded-lg border border-brand-primary/50 bg-brand-promo px-4 text-sm font-semibold text-brand-accent"
            >
              Sair da conta
            </button>
          )}
        </nav>
      </aside>
    </div>,
    document.body
  );
}
