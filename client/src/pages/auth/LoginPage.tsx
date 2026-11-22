import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorModal } from '../../components/feedback';
import { Button, Checkbox, Input, PasswordInput } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../layouts';
import type { ApiStructuredError } from '../../services/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deviceLimitMessage, setDeviceLimitMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Informe seu e-mail e senha.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({ email, password, rememberMe });
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/biblioteca', { replace: true });
      }
    } catch (err) {
      const apiErr = err as ApiStructuredError;
      if (apiErr.code === 'DEVICE_LIMIT_REACHED') {
        setDeviceLimitMessage(apiErr.message);
      } else {
        setFormError(apiErr.message || 'E-mail ou senha inválidos.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
          BIBLIOFLIX / SUA CONTA
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Bom ter você de volta.
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Entre para continuar de onde parou.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="marina@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Checkbox
              label="Lembrar acesso"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link
              to="/esqueceu-senha"
              className="text-xs font-semibold text-brand-accent hover:text-brand-primary transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-md border border-brand-primary/60 bg-brand-promo px-3.5 py-2.5 text-xs text-brand-accent"
            >
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-sm text-brand-muted">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-brand-accent hover:text-brand-primary">
            Cadastre-se
          </Link>
        </p>
      </div>

      <ErrorModal
        isOpen={Boolean(deviceLimitMessage)}
        onClose={() => setDeviceLimitMessage(null)}
        eyebrow="LIMITE DE DISPOSITIVOS"
        title="Limite de dispositivos atingido."
        description={
          deviceLimitMessage ??
          'Desconecte outro dispositivo conectado à sua conta para iniciar sessão aqui.'
        }
        primaryLabel="Entendi"
        secondaryLabel="Fechar"
      />
    </AuthLayout>
  );
}
