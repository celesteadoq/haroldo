import { useCallback, useEffect, useState } from 'react';
import { DataTable, Filters, Pagination } from '../../components/admin';
import { useToast } from '../../components/feedback';
import { Badge, Select } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminAuditLogItem } from '../../types/admin';

export function AdminAuditPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listAuditLogs({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        entityType: entityType || undefined,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar auditoria',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, entityType, showToast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <AdminLayout title="Auditoria" subtitle="Histórico das operações administrativas executadas.">
      <div className="space-y-6">
        <Filters
          searchValue={search}
          searchPlaceholder="Buscar por ação, entidade ou administrador..."
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onClear={() => {
            setSearch('');
            setEntityType('');
            setPage(1);
          }}
        >
          <div className="w-44">
            <Select
              aria-label="Filtrar entidade"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todas entidades' },
                { value: 'Book', label: 'Livros' },
                { value: 'Author', label: 'Autores' },
                { value: 'Category', label: 'Categorias' },
                { value: 'User', label: 'Usuários' },
                { value: 'Plan', label: 'Planos' },
                { value: 'Subscription', label: 'Assinaturas' },
                { value: 'HelpArticle', label: 'Ajuda' },
              ]}
            />
          </div>
        </Filters>

        <DataTable
          data={logs}
          loading={loading}
          keyExtractor={(l) => l.id}
          columns={[
            {
              key: 'action',
              header: 'Ação',
              render: (l) => <Badge variant="primary">{l.action}</Badge>,
            },
            {
              key: 'entity',
              header: 'Entidade',
              render: (l) => (
                <span>
                  {l.entityType} <span className="font-mono text-xs text-brand-subtle">({l.entityId})</span>
                </span>
              ),
            },
            {
              key: 'admin',
              header: 'Administrador',
              render: (l) => l.adminUser.name,
            },
            {
              key: 'details',
              header: 'Detalhes',
              render: (l) => (
                <span className="font-mono text-xs text-brand-muted">{l.details ?? '—'}</span>
              ),
            },
            {
              key: 'date',
              header: 'Data',
              render: (l) => new Date(l.createdAt).toLocaleString('pt-BR'),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
