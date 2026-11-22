import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog, DataTable, Filters, Pagination } from '../../components/admin';
import { useToast } from '../../components/feedback';
import { Badge, Button, Select, StatusBadge } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminAuthorItem, AdminBookItem, AdminCategoryItem } from '../../types/admin';

export function AdminBooksPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [books, setBooks] = useState<AdminBookItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [authors, setAuthors] = useState<AdminAuthorItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminBookItem | null>(null);

  useEffect(() => {
    void adminService.listCategories().then(setCategories).catch(() => undefined);
    void adminService.listAuthors().then(setAuthors).catch(() => undefined);
  }, []);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listBooks({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        authorId: authorId || undefined,
        status,
      });
      setBooks(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao listar livros',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryId, authorId, status, showToast]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function handleToggleActive(book: AdminBookItem) {
    try {
      await adminService.updateBook(book.id, { isActive: !book.isActive });
      showToast({
        type: 'success',
        title: book.isActive ? 'Livro desativado' : 'Livro ativado',
      });
      await loadBooks();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar livro',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await adminService.deleteBook(deleteTarget.id);
      setDeleteTarget(null);
      showToast({ type: 'info', title: 'Livro excluído' });
      await loadBooks();
    } catch (err) {
      setDeleteTarget(null);
      showToast({
        type: 'error',
        title: 'Não foi possível excluir',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <AdminLayout title="Livros" subtitle="Gerencie catálogo, níveis de acesso e prévias editoriais.">
      <div className="space-y-6">
        <Filters
          searchValue={search}
          searchPlaceholder="Buscar por título ou slug..."
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          onClear={() => {
            setSearch('');
            setCategoryId('');
            setAuthorId('');
            setStatus('all');
            setPage(1);
          }}
          actions={
            <Link to="/admin/livros/novo">
              <Button size="md" variant="primary">
                + Adicionar livro
              </Button>
            </Link>
          }
        >
          <div className="w-44">
            <Select
              aria-label="Categoria"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todas categorias' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Autor"
              value={authorId}
              onChange={(e) => {
                setAuthorId(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos autores' },
                ...authors.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
          <div className="w-36">
            <Select
              aria-label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Todos status' },
                { value: 'active', label: 'Ativos' },
                { value: 'inactive', label: 'Inativos' },
              ]}
            />
          </div>
        </Filters>

        <DataTable
          data={books}
          loading={loading}
          keyExtractor={(b) => b.id}
          columns={[
            {
              key: 'title',
              header: 'Título',
              render: (b) => (
                <div>
                  <p className="font-semibold text-white">{b.title}</p>
                  <p className="text-xs text-brand-muted">
                    {b.authors.map((a) => a.author.name).join(', ')}
                  </p>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Categoria',
              render: (b) => b.categories.map((c) => c.category.name).join(', ') || '—',
            },
            {
              key: 'access',
              header: 'Acesso',
              render: (b) => <Badge variant="neutral">{b.accessTier}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (b) => <StatusBadge status={b.isActive ? 'PUBLISHED' : 'ARCHIVED'} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              render: (b) => (
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/livros/${b.id}`)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleToggleActive(b)}
                  >
                    {b.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(b)}>
                    Excluir
                  </Button>
                </div>
              ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Excluir livro?"
        description={`Deseja excluir "${deleteTarget?.title ?? ''}"? Livros com leituras ou favoritos vinculados precisam ser desativados em vez de excluídos.`}
        confirmLabel="Confirmar exclusão"
        cancelLabel="Cancelar"
      />
    </AdminLayout>
  );
}
