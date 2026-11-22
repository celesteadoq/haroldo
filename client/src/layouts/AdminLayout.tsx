import { ReactNode, useContext, useState } from 'react';
import { AdminHeader, AdminSidebar } from '../components/admin';
import { AuthContext } from '../contexts/AuthContext';

export interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  adminName?: string;
  children: ReactNode;
}

export function AdminLayout({ title, subtitle, adminName, children }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const auth = useContext(AuthContext);
  const resolvedAdminName = adminName ?? auth?.user?.name ?? 'Administrador';

  return (
    <div className="flex min-h-screen bg-brand-bg text-white">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          adminName={resolvedAdminName}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
