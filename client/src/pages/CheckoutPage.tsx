import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorModal, SuccessModal } from '../components/feedback';
import { Button, Checkbox, Divider, EmptyState, Input, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import type { ApiStructuredError } from '../services/api';
import { subscriptionService } from '../services/subscriptionService';
import type { PlanItem } from '../types/subscription';

export function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const { user, refreshSessionUser, logout } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<PlanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cardHolderName, setCardHolderName] = useState(user?.name.toUpperCase() ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [declinedModalMsg, setDeclinedModalMsg] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    if (!planId) return;
    let active = true;

    async function loadPlan() {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await subscriptionService.getPlanById(planId!);
        if (active) setPlan(data);
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Plano não encontrado.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPlan();
    return () => {
      active = false;
    };
  }, [planId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!plan) return;

    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      setFormError('Informe um número de cartão válido (13 a 19 dígitos).');
      return;
    }

    const match = expiry.trim().match(/^(\d{2})\/(\d{2,4})$/);
    if (!match) {
      setFormError('Informe a validade no formato MM/AA.');
      return;
    }

    const expiryMonth = Number(match[1]);
    const rawYear = Number(match[2]);
    const expiryYear = rawYear < 100 ? 2000 + rawYear : rawYear;

    if (expiryMonth < 1 || expiryMonth > 12) {
      setFormError('Mês de validade inválido.');
      return;
    }

    if (!/^\d{3,4}$/.test(cvv.trim())) {
      setFormError('Informe um CVV válido com 3 ou 4 dígitos.');
      return;
    }

    if (!acceptedTerms) {
      setFormError('Confirme os termos da assinatura para prosseguir.');
      return;
    }

    try {
      setSubmitting(true);
      await subscriptionService.simulateCheckout({
        planId: plan.id,
        cardHolderName,
        cardNumber: digits,
        expiryMonth,
        expiryYear,
        cvv: cvv.trim(),
        acceptedTerms: true,
        idempotencyKey: idempotencyKeyRef.current,
      });
      await refreshSessionUser();
      setSuccessModalOpen(true);
    } catch (err) {
      const apiErr = err as ApiStructuredError;
      // Gera nova chave de idempotência para nova tentativa após recusa
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      if (apiErr.code === 'PAYMENT_DECLINED' || apiErr.statusCode === 402) {
        setDeclinedModalMsg(apiErr.message);
      } else {
        setFormError(apiErr.message || 'Erro ao processar pagamento simulado.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <UserLayout
      authState={user.role === 'ADMIN' ? 'admin' : 'user'}
      userName={user.name}
      onLogout={() => void logout()}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Finalize sua assinatura</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Fluxo simulado de checkout. Nenhuma cobrança financeira real é realizada e números completos ou CVV nunca são armazenados.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Skeleton className="h-96 rounded-xl lg:col-span-7" />
            <Skeleton className="h-72 rounded-xl lg:col-span-5" />
          </div>
        ) : loadError || !plan ? (
          <EmptyState
            title="Plano indisponível."
            description={loadError ?? 'Selecione um plano válido.'}
            action={<Button onClick={() => navigate('/planos')}>Voltar aos planos</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-5 lg:col-span-7"
              noValidate
            >
              <div>
                <h2 className="text-lg font-bold text-white">Cartão de crédito (Simulação)</h2>
                <p className="mt-1 text-xs text-brand-muted">
                  VISA • Mastercard • Elo — Final <strong>4242</strong> aprova; final{' '}
                  <strong>0002</strong> recusa.
                </p>
              </div>

              <Input
                label="Nome impresso no cartão"
                placeholder="MARINA COSTA"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                required
              />

              <Input
                label="Número do cartão"
                placeholder="4111 1111 1111 4242"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Validade (MM/AA)"
                  placeholder="12/28"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                />
                <Input
                  label="CVV"
                  placeholder="123"
                  inputMode="numeric"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                />
              </div>

              <Checkbox
                label="Confirmo os termos da assinatura mensal simulada e autorizo a ativação do plano."
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />

              {formError && (
                <p
                  role="alert"
                  className="rounded-md border border-brand-primary/60 bg-brand-promo px-3.5 py-2.5 text-xs text-brand-accent"
                >
                  {formError}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                Assinar {plan.name} • R$ {plan.price.toFixed(2).replace('.', ',')}
              </Button>
            </form>

            <aside className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-5 lg:col-span-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  RESUMO DA CONTRATAÇÃO
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-white">{plan.name}</h2>
                <p className="mt-1 text-sm text-brand-muted">{plan.description}</p>
              </div>

              <ul className="space-y-2 text-sm text-gray-200">
                <li>✓ Até {plan.maxDevices} dispositivo(s) simultâneo(s)</li>
                <li>
                  ✓{' '}
                  {plan.hasOfflineReading
                    ? `Até ${plan.offlineBookLimit} livros offline`
                    : 'Sem leitura offline'}
                </li>
                <li>✓ {plan.hasAds ? 'Com anúncios' : 'Sem anúncios'}</li>
              </ul>

              <Divider />

              <div className="space-y-1">
                <p className="text-xs text-brand-muted">Total hoje (simulado)</p>
                <p className="text-3xl font-extrabold text-white">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                  <span className="text-xs font-normal text-brand-muted"> /mês</span>
                </p>
              </div>

              <Button variant="outline" fullWidth onClick={() => navigate('/planos')}>
                Voltar aos planos
              </Button>
            </aside>
          </div>
        )}
      </div>

      <ErrorModal
        isOpen={Boolean(declinedModalMsg)}
        onClose={() => setDeclinedModalMsg(null)}
        eyebrow="PAGAMENTO NÃO APROVADO"
        title="Não foi possível validar o cartão."
        description={
          declinedModalMsg ??
          'Seu cartão foi recusado. Nenhuma cobrança foi realizada. Revise os dados ou use outro cartão.'
        }
        primaryLabel="Usar outro cartão"
        secondaryLabel="Voltar aos planos"
      />

      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => navigate('/minha-assinatura', { replace: true })}
        title="Seu próximo capítulo está liberado."
        description={`Sua assinatura ${plan?.name ?? ''} está ativa.`}
        primaryLabel="Ver minha assinatura"
        onPrimaryAction={() => navigate('/minha-assinatura', { replace: true })}
        secondaryLabel="Explorar catálogo"
      />
    </UserLayout>
  );
}
