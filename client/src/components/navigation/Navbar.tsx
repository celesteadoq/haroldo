import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { NotificationDropdown } from './NotificationDropdown';

export type NavbarAuthState = 'visitor' | 'user' | 'admin';

export interface NavbarProps {
  authState?: NavbarAuthState;
  userName?: string;
  unreadNotificationsCount?: number;
  showSearch?: boolean;
  onSearchSubmit?: (query: string) => void;
  onLogout?: () => void;
  onOpenMobileMenu: () => void;
}

export function Navbar({
  authState,
  userName,
  unreadNotificationsCount = 0,
  showSearch = false,
  onSearchSubmit,
  onLogout,
  onOpenMobileMenu,
}: NavbarProps) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const resolvedAuthState: NavbarAuthState =
    authState ?? (auth?.user ? (auth.user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor');
  const resolvedUserName = userName ?? auth?.user?.name ?? 'Minha conta';
  const resolvedLogout = onLogout ?? (auth ? () => void auth.logout() : undefined);

  const mainLinks = [
    { label: 'Início', to: '/' },
    { label: 'Explorar', to: '/catalogo' },
    { label: 'Categorias', to: '/categorias' },
    { label: 'Planos', to: '/planos' },
    { label: 'Ajuda', to: '/ajuda' },
  ];

  function handleSearch(query: string) {
    if (onSearchSubmit) {
      onSearchSubmit(query);
      return;
    }
    const trimmed = query.trim();
    navigate(trimmed ? `/catalogo?search=${encodeURIComponent(trimmed)}` : '/catalogo');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-brand-border/80 bg-brand-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <BrandLogo size="md" />
          <nav aria-label="Navegação principal" className="hidden lg:flex items-center gap-6">
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-brand-muted hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {resolvedAuthState !== 'visitor' && showSearch && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchValue);
            }}
            className="hidden md:flex flex-1 max-w-xs"
          >
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar título ou autor..."
              aria-label="Buscar livros"
              className="h-9 w-full rounded-md border border-brand-borderInput bg-brand-surface px-3 text-xs text-white placeholder:text-brand-subtle"
            />
          </form>
        )}

        <div className="hidden lg:flex items-center gap-5">
          {auth?.isLoading && !authState ? (
            <span className="h-4 w-24 animate-pulse rounded bg-brand-elevated" aria-hidden="true" />
          ) : resolvedAuthState === 'visitor' ? (
            <>
              <Link
                to="/entrar"
                className="text-sm font-semibold text-white hover:text-brand-accent transition-colors"
              >
                Entrar
              </Link>
              <Link to="/cadastro">
                <Button size="sm" variant="primary">
                  Assinar agora
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/biblioteca"
                className="text-sm font-medium text-brand-muted hover:text-white transition-colors"
              >
                Minha biblioteca
              </Link>
              {auth?.isAuthenticated ? (
                <NotificationDropdown />
              ) : (
                <Link
                  to="/notificacoes"
                  className="text-sm font-medium text-brand-muted hover:text-white transition-colors"
                >
                  Avisos ({unreadNotificationsCount})
                </Link>
              )}
              {resolvedAuthState === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-semibold text-brand-accent hover:text-brand-primary transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/minha-conta"
                className="text-sm font-semibold text-white hover:text-brand-accent transition-colors"
              >
                {resolvedUserName}
              </Link>
              {resolvedLogout && (
                <button
                  type="button"
                  onClick={resolvedLogout}
                  className="text-xs font-medium text-brand-muted hover:text-white transition-colors"
                >
                  Sair
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          {resolvedAuthState === 'visitor' && (
            <Link to="/entrar" className="text-sm font-semibold text-white">
              Entrar
            </Link>
          )}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Abrir menu de navegação"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-brand-borderInput bg-brand-surface px-3 text-sm font-medium text-white"
          >
            <span>Menu</span>
            <span aria-hidden="true">≡</span>
          </button>
        </div>
      </div>
    </header>
  );
}
