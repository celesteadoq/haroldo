import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanCard } from '../components/catalog';
import { ConfirmModal, SuccessModal, useToast } from '../components/feedback';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';
import { subscriptionService } from '../services/subscriptionService';
import type { CurrentSubscriptionResponse, PlanItem } from '../types/subscription';

export function PlansPage() {
  const { user, isAuthenticated, refreshSessionUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [currentInfo, setCurrentInfo] = useState<CurrentSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialSuccessOpen, setTrialSuccessOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const planList = await subscriptionService.listPlans();
      setPlans(planList);

      if (isAuthenticated) {
        const sub = await subscriptionService.getCurrentSubscription();
        setCurrentInfo(sub);
      } else {
        setCurrentInfo(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar planos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  async function handleSelectPlan(plan: PlanItem) {
    if (!isAuthenticated) {
      navigate('/cadastro', { state: { from: '/planos' } });
      return;
    }

    try {
      setProcessing(true);
      const res = await subscriptionService.changePlan(plan.id);
      if (res.nextAction === 'OFFER_TRIAL') {
        setTrialModalOpen(true);
        return;
      }
      if (res.nextAction === 'CHECKOUT') {
        navigate(`/checkout/${plan.id}`);
        return;
      }
      if (res.nextAction === 'CANCEL_CURRENT') {
        navigate('/minha-assinatura');
        return;
      }
      showToast({
        type: 'success',
        title: 'Alteração agendada',
        message: res.message,
      });
      await loadPlans();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível selecionar o plano',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleStartTrial() {
    try {
      setProcessing(true);
      await subscriptionService.startTrial();
      await refreshSessionUser();
      setTrialModalOpen(false);
      setTrialSuccessOpen(true);
      await loadPlans();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível iniciar o teste grátis',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setProcessing(false);
    }
  }

  const currentPlanId = currentInfo?.subscription?.plan.id;

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <div className="space-y-10">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
            SEU PRÓXIMO CAPÍTULO
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Seu próximo capítulo começa aqui.
          </h1>
          <p className="text-sm text-brand-muted">
            Uma boa história cabe em qualquer plano. Cancele quando quiser.
          </p>
        </div>

        {currentInfo?.subscription && (
          <section className="rounded-xl border border-brand-border bg-brand-surface p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                SEU PLANO ATUAL
              </p>
              <p className="mt-1 text-lg font-extrabold text-white">
                {currentInfo.subscription.plan.name} • R${' '}
                {currentInfo.subscription.plan.price.toFixed(2).replace('.', ',')}/mês
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/minha-assinatura')}>
              Gerenciar assinatura
            </Button>
          </section>
        )}

        {(!isAuthenticated || currentInfo?.trialEligible) && (
          <section className="rounded-xl border border-brand-borderPromo bg-brand-promo p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                7 dias para descobrir seu próximo favorito.
              </h2>
              <p className="mt-1 text-xs text-brand-muted">
                Primeira assinatura Premium com 7 dias grátis (R$ 0,00). Um teste por conta. Após o período, R$ 34,90/mês.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={processing}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/cadastro');
                } else {
                  setTrialModalOpen(true);
                }
              }}
            >
              Testar 7 dias grátis
            </Button>
          </section>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : errorMsg ? (
          <EmptyState
            title="Não foi possível carregar os planos."
            description={errorMsg}
            action={<Button onClick={() => void loadPlans()}>Tentar novamente</Button>}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = currentPlanId === plan.id && !currentInfo?.subscription?.cancelAtPeriodEnd;
                const benefits = [
                  `Até ${plan.maxDevices} dispositivo(s) conectado(s)`,
                  plan.hasOfflineReading
                    ? `Até ${plan.offlineBookLimit} livro(s) offline`
                    : 'Sem leitura offline',
                  plan.monthlyBookLimit
                    ? `Prévia editorial de 2 páginas + ${plan.monthlyBookLimit} desbloqueio/mês`
                    : 'Catálogo conforme permissões do plano',
                  plan.hasAds ? 'Com anúncios' : 'Experiência sem anúncios',
                ];

                return (
                  <PlanCard
                    key={plan.id}
                    name={plan.name}
                    description={plan.description}
                    price={plan.price}
                    benefits={benefits}
                    isRecommended={plan.name === 'Premium'}
                    isCurrent={isCurrent}
                    actionLabel={
                      plan.name === 'Gratuito'
                        ? 'Começar grátis'
                        : plan.name === 'Básico'
                          ? 'Escolher Básico'
                          : 'Assinar Premium →'
                    }
                    onSelect={() => void handleSelectPlan(plan)}
                  />
                );
              })}
            </div>

            {/* Tabela Comparativa */}
            <section className="overflow-x-auto rounded-xl border border-brand-border bg-brand-surface p-5">
              <h2 className="text-lg font-bold text-white mb-4">Comparação de benefícios</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-xs uppercase text-brand-muted">
                    <th className="py-3 pr-4">Recurso</th>
                    {plans.map((p) => (
                      <th key={p.id} className="py-3 px-4 text-white">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs sm:text-sm text-gray-200">
                  <tr>
                    <td className="py-3 pr-4 text-brand-muted">Valor mensal</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-4 font-semibold">
                        R$ {p.price.toFixed(2).replace('.', ',')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-brand-muted">Dispositivos simultâneos</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.maxDevices}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-brand-muted">Livros offline</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.offlineBookLimit}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-brand-muted">Experiência sem anúncios</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {p.hasAds ? 'Com anúncios' : 'Sem anúncios'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onConfirm={() => void handleStartTrial()}
        loading={processing}
        title="Iniciar 7 dias grátis no Premium?"
        description="Hoje será cobrado R$ 0,00. O teste é válido por 7 dias e pode ser utilizado uma única vez por conta."
        confirmLabel="Ativar teste grátis"
        cancelLabel="Agora não"
      />

      <SuccessModal
        isOpen={trialSuccessOpen}
        onClose={() => setTrialSuccessOpen(false)}
        title="Seu próximo capítulo está liberado."
        description="Seu teste gratuito Premium de 7 dias está ativo."
        primaryLabel="Gerenciar assinatura"
        onPrimaryAction={() => navigate('/minha-assinatura')}
        secondaryLabel="Explorar catálogo"
      />
    </AppShell>
  );
}
