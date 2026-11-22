import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InfoModal, SuccessModal, useToast } from '../../components/feedback';
import { Button, Checkbox, Input, PasswordInput } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../layouts';

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('A senha deve possuir no mínimo 8 caracteres, incluindo letras e números.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação de senha não confere.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    try {
      setSubmitting(true);
      await register({ name, email, password, confirmPassword, acceptedTerms });
      showToast({
        type: 'success',
        title: 'Bem-vindo ao Biblioflix!',
        message: 'Sua conta gratuita está ativa.',
      });
      setWelcomeOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar conta.');
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
          Sua história começa aqui.
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Crie sua conta grátis. Escolha um plano depois.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
          <Input
            label="Nome completo"
            placeholder="Marina Costa"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="marina@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            label="Senha"
            placeholder="••••••••••••"
            autoComplete="new-password"
            helperText="Mínimo de 8 caracteres, letras e números."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="Confirmar senha"
            placeholder="••••••••••••"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="space-y-2 pt-1">
            <Checkbox
              label="Ao criar sua conta, você concorda com os Termos de Uso e a Política de Privacidade."
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <div className="flex gap-4 pl-6 text-xs text-brand-accent">
              <button type="button" onClick={() => setLegalModal('terms')} className="hover:underline">
                Ler Termos de Uso
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:underline"
              >
                Ler Política de Privacidade
              </button>
            </div>
          </div>

          {errorMsg && (
            <p
              role="alert"
              className="rounded-md border border-brand-primary/60 bg-brand-promo px-3.5 py-2.5 text-xs text-brand-accent"
            >
              {errorMsg}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Criar conta grátis
          </Button>
        </form>

        <div className="mt-5">
          <Link to="/entrar" className="text-sm font-semibold text-brand-accent hover:text-brand-primary">
            ← Voltar para entrar
          </Link>
        </div>
      </div>

      <SuccessModal
        isOpen={welcomeOpen}
        onClose={() => navigate('/biblioteca', { replace: true })}
        title="Sua biblioteca começa agora."
        description="Conta criada! Explore histórias ou conheça os benefícios do Premium."
        primaryLabel="Ir para minha biblioteca"
        onPrimaryAction={() => navigate('/biblioteca', { replace: true })}
        secondaryLabel="Conhecer planos"
      />

      <InfoModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title="Termos de uso"
        description="A assinatura é pessoal e recorrente quando contratada. Você pode alterar ou cancelar o plano em Minha assinatura."
      />
      <InfoModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title="Sua privacidade importa."
        description="Seus dados são usados para gerenciar a conta, sincronizar leituras e manter a segurança das sessões."
      />
    </AuthLayout>
  );
}
