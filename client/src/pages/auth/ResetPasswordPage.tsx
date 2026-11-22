import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SuccessModal } from '../../components/feedback';
import { Button, Input, PasswordInput } from '../../components/ui';
import { AuthLayout } from '../../layouts';
import { authService } from '../../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialToken = searchParams.get('token') ?? '';
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    if (!token.trim()) {
      setErrorMsg('Token de recuperação ausente ou inválido.');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('A senha deve possuir no mínimo 8 caracteres, letras e números.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não conferem.');
      return;
    }

    try {
      setSubmitting(true);
      await authService.resetPassword({ token, password, confirmPassword });
      setSuccessOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Token inválido ou expirado.');
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
          Crie uma nova senha.
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Escolha uma senha segura para sua conta.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {!initialToken && (
            <Input
              label="Token de recuperação"
              placeholder="Cole o token recebido"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          )}

          <PasswordInput
            label="Nova senha"
            placeholder="••••••••••••"
            helperText="Mínimo de 8 caracteres, letras e números."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="Confirmar senha"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {errorMsg && (
            <p
              role="alert"
              className="rounded-md border border-brand-primary/60 bg-brand-promo px-3.5 py-2.5 text-xs text-brand-accent"
            >
              {errorMsg}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Salvar nova senha
          </Button>
        </form>

        <div className="mt-5">
          <Link to="/entrar" className="text-sm font-semibold text-brand-accent hover:text-brand-primary">
            ← Voltar para entrar
          </Link>
        </div>
      </div>

      <SuccessModal
        isOpen={successOpen}
        onClose={() => navigate('/entrar', { replace: true })}
        title="Nova senha salva."
        description="Seu acesso está protegido. Entre com a nova senha para continuar lendo."
        primaryLabel="Ir para entrar"
        onPrimaryAction={() => navigate('/entrar', { replace: true })}
        secondaryLabel="Fechar"
      />
    </AuthLayout>
  );
}
