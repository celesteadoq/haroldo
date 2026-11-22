import { FormEvent, useCallback, useEffect, useState } from 'react';
import { DataTable, Filters, Pagination } from '../../components/admin';
import { FormModal, useToast } from '../../components/feedback';
import { Badge, Button, Checkbox, Select, StatusBadge } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminPlanItem, AdminSubscriptionItem } from '../../types/admin';
import type { UserSubscriptionSummary } from '../../types/auth';

export function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminSubscriptionItem[]>([]);
  const [plans, setPlans] = useState<AdminPlanItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [planId, setPlanId] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserSubscriptionSummary['status'] | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<AdminSubscriptionItem | null>(null);
  const [nextStatus, setNextStatus] = useState<UserSubscriptionSummary['status']>('ACTIVE');
  const [cancelAtEnd, setCancelAtEnd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminService.listPlans().then(setPlans).catch(() => undefined);
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listSubscriptions({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        planId: planId || undefined,
        status: statusFilter || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao listar assinaturas',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, planId, statusFilter, showToast]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      await adminService.updateSubscription(editing.id, {
        status: nextStatus,
        cancelAtPeriodEnd: cancelAtEnd,
      });
      setEditing(null);
      showToast({ type: 'success', title: 'Assinatura atualizada' });
      await loadSubscriptions();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar assinatura',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Assinaturas" subtitle="Monitore vigências, testes gratuitos, cancelamentos e alterações.">
      <div className="space-y-6">
        <Filters
          searchValue={search}
          searchPlaceholder="Buscar por assinante..."
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onClear={() => {
            setSearch('');
            setPlanId('');
            setStatusFilter('');
            setPage(1);
          }}
        >
          <div className="w-40">
            <Select
              aria-label="Filtrar plano"
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos planos' },
                ...plans.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Filtrar status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserSubscriptionSummary['status'] | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos status' },
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'TRIALING', label: 'TRIALING' },
                { value: 'PENDING', label: 'PENDING' },
                { value: 'PAST_DUE', label: 'PAST_DUE' },
                { value: 'CANCELED', label: 'CANCELED' },
                { value: 'EXPIRED', label: 'EXPIRED' },
              ]}
            />
          </div>
        </Filters>

        <DataTable
          data={items}
          loading={loading}
          keyExtractor={(s) => s.id}
          columns={[
            {
              key: 'user',
              header: 'Assinante',
              render: (s) => (
                <div>
                  <p className="font-semibold text-white">{s.user.name}</p>
                  <p className="text-xs text-brand-muted">{s.user.email}</p>
                </div>
              ),
            },
            {
              key: 'plan',
              header: 'Plano',
              render: (s) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{s.plan.name}</span>
                  {s.isTrial && <Badge variant="info">Teste</Badge>}
                  {s.cancelAtPeriodEnd && <Badge variant="warning">Cancela ao fim</Badge>}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (s) => <StatusBadge status={s.status} />,
            },
            {
              key: 'endDate',
              header: 'Fim / Teste',
              render: (s) => {
                const target = s.trialEndDate ?? s.endDate;
                return target ? new Date(target).toLocaleDateString('pt-BR') : '—';
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              render: (s) => (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(s);
                      setNextStatus(s.status);
                      setCancelAtEnd(s.cancelAtPeriodEnd);
                    }}
                  >
                    Gerenciar
                  </Button>
                </div>
              ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      </div>

      <FormModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
        loading={saving}
        title="Gerenciar assinatura"
        description={`Assinante: ${editing?.user.name ?? ''} (${editing?.plan.name ?? ''})`}
      >
        <Select
          label="Status"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as UserSubscriptionSummary['status'])}
          options={[
            { value: 'ACTIVE', label: 'ACTIVE' },
            { value: 'TRIALING', label: 'TRIALING' },
            { value: 'PENDING', label: 'PENDING' },
            { value: 'PAST_DUE', label: 'PAST_DUE' },
            { value: 'CANCELED', label: 'CANCELED' },
            { value: 'EXPIRED', label: 'EXPIRED' },
            { value: 'SUSPENDED', label: 'SUSPENDED' },
          ]}
        />
        <Checkbox
          label="Cancelar renovação ao fim do período"
          checked={cancelAtEnd}
          onChange={(e) => setCancelAtEnd(e.target.checked)}
        />
      </FormModal>
    </AdminLayout>
  );
}
