import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal, SuccessModal, useToast } from '../components/feedback';
import { OfflineBooksManager } from '../components/library/OfflineBooksManager';
import {
  Badge,
  Button,
  EmptyState,
  ProgressBar,
  Skeleton,
  StatusBadge,
} from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import { subscriptionService } from '../services/subscriptionService';
import type { CurrentSubscriptionResponse, PaymentRecord } from '../types/subscription';

export function SubscriptionPage() {
  const { user, refreshSessionUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [details, setDetails] = useState<CurrentSubscriptionResponse | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelSuccessOpen, setCancelSuccessOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [subData, paymentList] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.listPayments(),
      ]);
      setDetails(subData);
      setPayments(paymentList);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar assinatura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  async function handleCancelSubscription() {
    try {
      setCanceling(true);
      await subscriptionService.cancelSubscription();
      await refreshSessionUser();
      setCancelConfirmOpen(false);
      setCancelSuccessOpen(true);
      await loadSubscription();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível cancelar',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCanceling(false);
    }
  }

  if (!user) return null;

  const sub = details?.subscription;
  const plan = sub?.plan;
  const canCancel = Boolean(sub && plan && plan.price > 0 && !sub.cancelAtPeriodEnd);

  return (
    <UserLayout
      authState={user.role === 'ADMIN' ? 'admin' : 'user'}
      userName={user.name}
      onLogout={() => void logout()}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Minha assinatura</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Acompanhe seu plano, uso de dispositivos, livros offline e histórico de pagamentos.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/planos')}>
            Alterar ou comparar planos
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        ) : errorMsg || !details || !sub || !plan ? (
          <EmptyState
            title="Não foi possível carregar sua assinatura."
            description={errorMsg ?? 'Tente novamente em instantes.'}
            action={<Button onClick={() => void loadSubscription()}>Tentar novamente</Button>}
          />
        ) : (
          <>
            {/* Resumo da Assinatura */}
            <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                    PLANO ATUAL
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-white">{plan.name}</h2>
                    <StatusBadge status={sub.status} />
                    {sub.isTrial && <Badge variant="info">Teste grátis 7 dias</Badge>}
                    {sub.cancelAtPeriodEnd && <Badge variant="warning">Cancelamento agendado</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-brand-muted">
                    R$ {plan.price.toFixed(2).replace('.', ',')}/mês
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {sub.isTrial && (
                    <Button size="sm" onClick={() => navigate(`/checkout/${plan.id}`)}>
                      Confirmar assinatura paga
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setCancelConfirmOpen(true)}
                    >
                      Cancelar assinatura
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs rounded-lg border border-brand-border bg-brand-bg p-4">
                <div>
                  <p className="text-brand-subtle">Início da vigência</p>
                  <p className="mt-1 font-semibold text-white">
                    {new Date(sub.startDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-brand-subtle">
                    {sub.isTrial
                      ? 'Término do teste gratuito'
                      : sub.cancelAtPeriodEnd
                        ? 'Acesso garantido até'
                        : 'Próxima cobrança'}
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {(sub.trialEndDate ?? sub.endDate)
                      ? new Date((sub.trialEndDate ?? sub.endDate)!).toLocaleDateString('pt-BR')
                      : 'Sem expiração (Gratuito)'}
                  </p>
                </div>
                <div>
                  <p className="text-brand-subtle">Alteração agendada</p>
                  <p className="mt-1 font-semibold text-white">
                    {sub.pendingPlan ? `Mudará para ${sub.pendingPlan.name}` : 'Nenhuma'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProgressBar
                  value={
                    details.usage.maxDevices > 0
                      ? (details.usage.activeDevices / details.usage.maxDevices) * 100
                      : 0
                  }
                  label={`Dispositivos conectados (${details.usage.activeDevices}/${details.usage.maxDevices})`}
                  showLabel
                />
                <ProgressBar
                  value={
                    details.usage.offlineBookLimit > 0
                      ? (details.usage.offlineBooks / details.usage.offlineBookLimit) * 100
                      : 0
                  }
                  label={`Livros offline (${details.usage.offlineBooks}/${details.usage.offlineBookLimit})`}
                  showLabel
                />
              </div>
            </section>

            {/* Gerenciamento Offline */}
            <OfflineBooksManager />

            {/* Histórico de Pagamentos Simulados */}
            <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Pagamentos e cobranças</h2>
                <p className="text-xs text-brand-muted">
                  Registros de pagamentos simulados (apenas bandeira e 4 últimos dígitos).
                </p>
              </div>

              {payments.length === 0 ? (
                <EmptyState
                  title="Nenhuma cobrança realizada."
                  description="Ao contratar um plano pago, suas transações simuladas aparecerão aqui."
                />
              ) : (
                <div className="divide-y divide-brand-border">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {payment.plan?.name ?? 'Plano'} • R${' '}
                            {payment.amount.toFixed(2).replace('.', ',')}
                          </span>
                          <StatusBadge status={payment.status} />
                        </div>
                        <p className="mt-1 text-xs text-brand-muted">
                          {payment.paymentMethod} • {new Date(payment.createdAt).toLocaleString('pt-BR')}
                        </p>
                        {payment.failureReason && (
                          <p className="mt-0.5 text-xs text-brand-accent">{payment.failureReason}</p>
                        )}
                      </div>
                      <span className="font-mono text-xs text-brand-subtle">
                        {payment.transactionReference ?? payment.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Histórico de Alterações da Assinatura */}
            {details.history.length > 0 && (
              <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Histórico de alterações do plano</h2>
                <div className="divide-y divide-brand-border text-xs">
                  {details.history.map((entry) => (
                    <div key={entry.id} className="py-3 flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">
                          {entry.fromPlan ? `${entry.fromPlan.name} → ` : ''}
                          {entry.toPlan.name} ({entry.action})
                        </p>
                        {entry.notes && <p className="text-brand-muted mt-0.5">{entry.notes}</p>}
                      </div>
                      <span className="text-brand-subtle">
                        {new Date(entry.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => void handleCancelSubscription()}
        loading={canceling}
        title="Cancelar a renovação?"
        description={
          sub?.isTrial
            ? 'Cancelar durante o teste gratuito impede qualquer cobrança futura.'
            : 'Você continua com acesso até a data de término informada. Depois, sua conta volta ao Gratuito e sua biblioteca e progresso permanecem preservados.'
        }
        confirmLabel="Confirmar cancelamento"
        cancelLabel="Manter assinatura"
      />

      <SuccessModal
        isOpen={cancelSuccessOpen}
        onClose={() => setCancelSuccessOpen(false)}
        title="Renovação cancelada."
        description="Nenhuma nova cobrança será realizada. Seu acesso continua até o fim do período vigente."
        primaryLabel="Entendi"
      />
    </UserLayout>
  );
}
