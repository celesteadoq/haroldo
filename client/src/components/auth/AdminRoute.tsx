import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '../ui';
import { useAuth } from '../../hooks/useAuth';

export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <LoadingScreen
          title="Verificando permissões..."
          description="Validando acesso administrativo."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/minha-conta" replace />;
  }

  return <Outlet />;
}
