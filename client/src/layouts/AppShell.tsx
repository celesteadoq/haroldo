import { ReactNode, useState } from 'react';
import { Footer, FooterVariant, MobileMenu, Navbar, NavbarAuthState } from '../components/navigation';

export interface AppShellProps {
  children: ReactNode;
  authState?: NavbarAuthState;
  userName?: string;
  unreadNotificationsCount?: number;
  showSearch?: boolean;
  onSearchSubmit?: (query: string) => void;
  onLogout?: () => void;
  footerVariant?: FooterVariant;
  containerClassName?: string;
}

export function AppShell({
  children,
  authState = 'visitor',
  userName,
  unreadNotificationsCount = 0,
  showSearch = false,
  onSearchSubmit,
  onLogout,
  footerVariant = 'minimal',
  containerClassName = 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8',
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-white">
      <Navbar
        authState={authState}
        userName={userName}
        unreadNotificationsCount={unreadNotificationsCount}
        showSearch={showSearch}
        onSearchSubmit={onSearchSubmit}
        onLogout={onLogout}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        authState={authState}
        onLogout={onLogout}
      />

      <main className={`flex-1 ${containerClassName}`}>{children}</main>

      <Footer variant={footerVariant} />
    </div>
  );
}
