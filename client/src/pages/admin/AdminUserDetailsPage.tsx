import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/admin';
import { useToast } from '../../components/feedback';
import { Badge, Button, EmptyState, Select, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminUserDetails } from '../../types/admin';
import type { UserRole } from '../../types/auth';

export function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user: actingAdmin } = useAuth();
  const { showToast } = useToast();

  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setDetails(await adminService.getUserDetails(id));
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar usuário',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function handleRoleChange(nextRole: UserRole) {
    if (!details) return;
    try {
      setSaving(true);
      await adminService.updateUserAccess(details.id, { role: nextRole });
      showToast({ type: 'success', title: 'Permissão atualizada' });
      await loadUser();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Operação não permitida',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBlock() {
    if (!details) return;
    try {
      setSaving(true);
      await adminService.updateUserAccess(details.id, { isBlocked: !details.isBlocked });
      setConfirmBlockOpen(false);
      showToast({
        type: 'success',
        title: details.isBlocked ? 'Usuário desbloqueado' : 'Usuário bloqueado e sessões revogadas',
      });
      await loadUser();
    } catch (err) {
      setConfirmBlockOpen(false);
      showToast({
        type: 'error',
        title: 'Erro ao alterar bloqueio',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const isSelf = actingAdmin?.id === details?.id;

  return (
    <AdminLayout title="Gerenciar usuário" subtitle="Inspeção de conta, assinatura, pagamentos e dispositivos.">
      <div className="space-y-6">
        <Link to="/admin/usuarios" className="text-xs font-medium text-brand-muted hover:text-white">
          ← Voltar para usuários
        </Link>

        {loading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !details ? (
          <EmptyState title="Usuário não encontrado." description="Verifique o identificador informado." />
        ) : (
          <>
            <section className="rounded-xl border border-brand-border bg-brand-surface p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">{details.name}</h2>
                  <Badge variant={details.role === 'ADMIN' ? 'primary' : 'neutral'}>{details.role}</Badge>
                  <StatusBadge status={details.isBlocked ? 'SUSPENDED' : 'ACTIVE'} />
                </div>
                <p className="text-sm text-brand-muted">{details.email}</p>
                <p className="text-xs text-brand-subtle">
                  Cadastro: {new Date(details.createdAt).toLocaleString('pt-BR')} • Teste grátis:{' '}
                  {details.trialUsedAt ? 'Já utilizado' : 'Disponível'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-36">
                  <Select
                    aria-label="Perfil de acesso"
                    value={details.role}
                    disabled={saving || isSelf}
                    onChange={(e) => void handleRoleChange(e.target.value as UserRole)}
                    options={[
                      { value: 'USER', label: 'Leitor (USER)' },
                      { value: 'ADMIN', label: 'Admin (ADMIN)' },
                    ]}
                  />
                </div>
                <Button
                  variant={details.isBlocked ? 'secondary' : 'danger'}
                  disabled={saving || isSelf}
                  onClick={() => setConfirmBlockOpen(true)}
                >
                  {details.isBlocked ? 'Desbloquear' : 'Bloquear conta'}
                </Button>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
                <h3 className="text-base font-bold text-white">Assinaturas</h3>
                {details.subscriptions.length === 0 ? (
                  <p className="text-xs text-brand-muted">Sem assinaturas.</p>
                ) : (
                  <div className="divide-y divide-brand-border text-xs">
                    {details.subscriptions.map((s) => (
                      <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{s.plan.name}</p>
                          <p className="text-brand-subtle">
                            Início: {new Date(s.startDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
                <h3 className="text-base font-bold text-white">Dispositivos ativos ({details.devices.length})</h3>
                {details.devices.length === 0 ? (
                  <p className="text-xs text-brand-muted">Nenhum dispositivo conectado.</p>
                ) : (
                  <div className="divide-y divide-brand-border text-xs">
                    {details.devices.map((d) => (
                      <div key={d.id} className="py-2.5 flex justify-between gap-2">
                        <span className="font-semibold text-white">{d.deviceName}</span>
                        <span className="text-brand-subtle">
                          {new Date(d.lastActiveAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
                <h3 className="text-base font-bold text-white">Histórico de pagamentos</h3>
                {details.payments.length === 0 ? (
                  <p className="text-xs text-brand-muted">Sem pagamentos simulados.</p>
                ) : (
                  <div className="divide-y divide-brand-border text-xs">
                    {details.payments.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">
                            {p.plan?.name ?? 'Plano'} • R$ {p.amount.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-brand-subtle">
                            {p.paymentMethod} • {new Date(p.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
                <h3 className="text-base font-bold text-white">Atividade recente de leitura</h3>
                {details.readingHistory.length === 0 ? (
                  <p className="text-xs text-brand-muted">Nenhuma leitura registrada.</p>
                ) : (
                  <div className="divide-y divide-brand-border text-xs">
                    {details.readingHistory.map((h) => (
                      <div key={h.id} className="py-2.5 flex justify-between gap-2">
                        <span className="font-semibold text-white">{h.book.title}</span>
                        <span className="text-brand-muted">
                          Pág. {h.lastPage} ({Math.round(h.progressPercentage)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={() => void handleToggleBlock()}
        loading={saving}
        title={details?.isBlocked ? 'Desbloquear conta?' : 'Bloquear conta?'}
        description={
          details?.isBlocked
            ? 'O usuário voltará a poder autenticar na plataforma.'
            : 'Ao bloquear, todas as sessões e dispositivos ativos do usuário serão imediatamente encerrados.'
        }
      />
    </AdminLayout>
  );
}
