import { ReactNode } from 'react';
import { AppShell } from './AppShell';

export interface PublicLayoutProps {
  children: ReactNode;
  containerClassName?: string;
}

export function PublicLayout({ children, containerClassName }: PublicLayoutProps) {
  return (
    <AppShell authState="visitor" footerVariant="full" containerClassName={containerClassName}>
      {children}
    </AppShell>
  );
}
