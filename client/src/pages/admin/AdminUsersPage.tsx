import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Filters, Pagination } from '../../components/admin';
import { useToast } from '../../components/feedback';
import { Badge, Button, Select, StatusBadge } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminPlanItem, AdminUserListItem } from '../../types/admin';

export function AdminUsersPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [plans, setPlans] = useState<AdminPlanItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminService.listPlans().then(setPlans).catch(() => undefined);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listUsers({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        planId: planId || undefined,
        status,
      });
      setUsers(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao listar usuários',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, planId, status, showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <AdminLayout title="Usuários" subtitle="Consulte contas, planos, dispositivos e permissões.">
      <div className="space-y-6">
        <Filters
          searchValue={search}
          searchPlaceholder="Buscar por nome ou e-mail..."
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onClear={() => {
            setSearch('');
            setPlanId('');
            setStatus('all');
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
          <div className="w-40">
            <Select
              aria-label="Filtrar status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'all' | 'active' | 'blocked');
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Todos status' },
                { value: 'active', label: 'Ativos' },
                { value: 'blocked', label: 'Bloqueados' },
              ]}
            />
          </div>
        </Filters>

        <DataTable
          data={users}
          loading={loading}
          keyExtractor={(u) => u.id}
          columns={[
            {
              key: 'user',
              header: 'Usuário',
              render: (u) => (
                <div>
                  <p className="font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-brand-muted">{u.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Perfil',
              render: (u) => (
                <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'}>{u.role}</Badge>
              ),
            },
            {
              key: 'plan',
              header: 'Plano atual',
              render: (u) => u.subscriptions[0]?.plan.name ?? 'Gratuito',
            },
            {
              key: 'status',
              header: 'Status',
              render: (u) => <StatusBadge status={u.isBlocked ? 'SUSPENDED' : 'ACTIVE'} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              render: (u) => (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/usuarios/${u.id}`)}
                  >
                    Detalhes →
                  </Button>
                </div>
              ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
