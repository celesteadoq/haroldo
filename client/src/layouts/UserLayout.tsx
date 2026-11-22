import { ReactNode, useContext } from 'react';
import type { NavbarAuthState } from '../components/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AppShell } from './AppShell';

export interface UserLayoutProps {
  children: ReactNode;
  authState?: Extract<NavbarAuthState, 'user' | 'admin'>;
  userName?: string;
  unreadNotificationsCount?: number;
  onLogout?: () => void;
}

export function UserLayout({
  children,
  authState,
  userName,
  unreadNotificationsCount = 0,
  onLogout,
}: UserLayoutProps) {
  const auth = useContext(AuthContext);

  const resolvedState: Extract<NavbarAuthState, 'user' | 'admin'> =
    authState ?? (auth?.user?.role === 'ADMIN' ? 'admin' : 'user');
  const resolvedName = userName ?? auth?.user?.name ?? 'Minha conta';
  const resolvedLogout = onLogout ?? (auth ? () => void auth.logout() : undefined);

  return (
    <AppShell
      authState={resolvedState}
      userName={resolvedName}
      unreadNotificationsCount={unreadNotificationsCount}
      onLogout={resolvedLogout}
      showSearch
      footerVariant="minimal"
    >
      {children}
    </AppShell>
  );
}
