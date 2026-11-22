import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';

export function NotFoundPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <EmptyState
        eyebrow="404"
        title="Página não encontrada."
        description="O endereço acessado não existe ou foi movido. Volte ao início ou explore o catálogo."
        action={<Button onClick={() => navigate('/')}>Ir para o início</Button>}
        secondaryAction={
          <Button variant="outline" onClick={() => navigate('/catalogo')}>
            Explorar catálogo
          </Button>
        }
      />
    </AppShell>
  );
}
