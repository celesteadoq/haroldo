import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InfoModal } from '../../components/feedback';
import { Button, Input } from '../../components/ui';
import { AuthLayout } from '../../layouts';
import { authService } from '../../services/authService';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentModalOpen, setSentModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Informe o e-mail cadastrado.');
      return;
    }

    try {
      setSubmitting(true);
      await authService.forgotPassword(email);
      setSentModalOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar solicitação.');
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
          Esqueceu sua senha?
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Vamos enviar um link para você recuperar o acesso.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Input
            label="E-mail"
            type="email"
            placeholder="marina@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Enviar link de recuperação
          </Button>
        </form>

        <div className="mt-5">
          <Link to="/entrar" className="text-sm font-semibold text-brand-accent hover:text-brand-primary">
            ← Voltar para entrar
          </Link>
        </div>
      </div>

      <InfoModal
        isOpen={sentModalOpen}
        onClose={() => {
          setSentModalOpen(false);
          navigate('/entrar');
        }}
        title="Confira seu e-mail."
        description={`Se existe uma conta com ${email}, você receberá o link de recuperação. Em ambiente de desenvolvimento sem SMTP, verifique o console do servidor.`}
        actionLabel="Voltar para entrar"
      />
    </AuthLayout>
  );
}
