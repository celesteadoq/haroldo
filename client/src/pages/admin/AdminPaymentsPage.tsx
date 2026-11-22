import { useCallback, useEffect, useState } from 'react';
import { DataTable, Filters, Pagination } from '../../components/admin';
import { useToast } from '../../components/feedback';
import { Select, StatusBadge } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminPaymentItem, DashboardPeriod } from '../../types/admin';
import type { PaymentStatus } from '../../types/subscription';

export function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminPaymentItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [period, setPeriod] = useState<DashboardPeriod>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listPayments({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        period,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao listar pagamentos',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, period, showToast]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  return (
    <AdminLayout
      title="Pagamentos (Simulados)"
      subtitle="Consulta somente leitura. Números completos de cartão e CVV nunca são armazenados."
    >
      <div className="space-y-6">
        <Filters
          searchValue={search}
          searchPlaceholder="Buscar por usuário..."
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onClear={() => {
            setSearch('');
            setStatusFilter('');
            setPeriod('all');
            setPage(1);
          }}
        >
          <div className="w-40">
            <Select
              aria-label="Status do pagamento"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PaymentStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos status' },
                { value: 'PAID', label: 'Aprovado (PAID)' },
                { value: 'FAILED', label: 'Recusado (FAILED)' },
                { value: 'PENDING', label: 'Pendente' },
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              aria-label="Período"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as DashboardPeriod);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Todo período' },
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: '90d', label: 'Últimos 90 dias' },
              ]}
            />
          </div>
        </Filters>

        <DataTable
          data={items}
          loading={loading}
          keyExtractor={(p) => p.id}
          columns={[
            {
              key: 'user',
              header: 'Usuário',
              render: (p) => (
                <div>
                  <p className="font-semibold text-white">{p.user.name}</p>
                  <p className="text-xs text-brand-muted">{p.user.email}</p>
                </div>
              ),
            },
            {
              key: 'plan',
              header: 'Plano / Valor',
              render: (p) => (
                <span>
                  {p.plan?.name ?? '—'} • R$ {p.amount.toFixed(2).replace('.', ',')}
                </span>
              ),
            },
            {
              key: 'method',
              header: 'Método',
              render: (p) => (
                <div>
                  <p>{p.paymentMethod}</p>
                  {p.failureReason && <p className="text-xs text-brand-accent">{p.failureReason}</p>}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (p) => <StatusBadge status={p.status} />,
            },
            {
              key: 'date',
              header: 'Data',
              render: (p) => new Date(p.createdAt).toLocaleString('pt-BR'),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
