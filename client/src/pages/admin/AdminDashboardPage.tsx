import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/admin';
import { Button, EmptyState, Select, Skeleton } from '../../components/ui';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminDashboardResponse, DashboardPeriod } from '../../types/admin';

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setData(await adminService.getDashboard(period));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar painel.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxPlanCount = Math.max(1, ...(data?.planDistribution.map((p) => p.count) ?? [1]));

  return (
    <AdminLayout title="Visão geral" subtitle="Indicadores reais da base SQLite e receita simulada.">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/livros/novo">
              <Button size="sm" variant="primary">
                + Adicionar livro
              </Button>
            </Link>
            <Link to="/admin/usuarios">
              <Button size="sm" variant="outline">
                Gerenciar usuários
              </Button>
            </Link>
          </div>

          <div className="w-52">
            <Select
              aria-label="Filtrar período"
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              options={[
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: '90d', label: 'Últimos 90 dias' },
                { value: 'all', label: 'Todo o período' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : errorMsg || !data ? (
          <EmptyState
            eyebrow="ERRO"
            title="Não foi possível carregar as métricas."
            description={errorMsg ?? 'Tente novamente.'}
            action={<Button onClick={() => void loadDashboard()}>Tentar novamente</Button>}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Usuários cadastrados"
                value={data.metrics.totalUsers}
                helper={`${data.metrics.activeUsers} ativos • ${data.metrics.usersInPeriod} no período`}
              />
              <StatCard
                label="Assinantes pagos ativos"
                value={data.metrics.activeSubscribers}
                helper={`${data.metrics.trialingUsers} em teste grátis`}
                highlight
              />
              <StatCard
                label="Receita simulada (período)"
                value={`R$ ${data.metrics.simulatedRevenue.toFixed(2).replace('.', ',')}`}
                helper={`${data.metrics.paidPaymentsCount} aprovado(s) • ${data.metrics.failedPaymentsCount} recusado(s)`}
                highlight
              />
              <StatCard
                label="Livros cadastrados"
                value={data.metrics.totalBooks}
                helper={`${data.metrics.activeBooks} ativo(s) no catálogo`}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Distribuição por Plano */}
              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-4">
                <h2 className="text-base font-bold text-white">Distribuição por plano</h2>
                {data.planDistribution.length === 0 ? (
                  <p className="text-xs text-brand-muted">Sem assinaturas registradas.</p>
                ) : (
                  <div className="space-y-3">
                    {data.planDistribution.map((item) => (
                      <div key={item.planId} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white">{item.planName}</span>
                          <span className="text-brand-muted">{item.count} conta(s)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-brand-bg overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-primary"
                            style={{ width: `${Math.round((item.count / maxPlanCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Livros mais acessados e favoritados */}
              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-white">Mais acessados</h2>
                  {data.mostAccessedBooks.length === 0 ? (
                    <p className="mt-2 text-xs text-brand-muted">Nenhum acesso registrado ainda.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {data.mostAccessedBooks.map((b) => (
                        <li key={b.bookId} className="flex justify-between text-gray-200">
                          <span>{b.title}</span>
                          <span className="text-brand-muted">{b.count} leitura(s)</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-3 border-t border-brand-border">
                  <h2 className="text-base font-bold text-white">Mais favoritados</h2>
                  {data.mostFavoritedBooks.length === 0 ? (
                    <p className="mt-2 text-xs text-brand-muted">Nenhum favorito registrado ainda.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {data.mostFavoritedBooks.map((b) => (
                        <li key={b.bookId} className="flex justify-between text-gray-200">
                          <span>{b.title}</span>
                          <span className="text-brand-muted">{b.count} favorito(s)</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            {/* Atividade recente */}
            <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">O que acontece por aqui (Auditoria)</h2>
                <Link to="/admin/auditoria" className="text-xs font-semibold text-brand-accent hover:underline">
                  Ver tudo →
                </Link>
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="text-xs text-brand-muted">Nenhuma ação administrativa registrada ainda.</p>
              ) : (
                <div className="divide-y divide-brand-border text-xs">
                  {data.recentActivity.map((log) => (
                    <div key={log.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                      <span className="text-gray-200">
                        <strong>{log.adminUser.name}</strong> • {log.action} ({log.entityType})
                      </span>
                      <span className="text-brand-subtle">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
