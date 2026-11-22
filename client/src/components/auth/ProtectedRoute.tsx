import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '../ui';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <LoadingScreen
          title="Verificando sua sessão..."
          description="Preparando sua conta Biblioflix."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
