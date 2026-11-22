import { FormEvent, useCallback, useEffect, useState } from 'react';
import { DataTable } from '../../components/admin';
import { FormModal, useToast } from '../../components/feedback';
import { Button, Checkbox, Input, StatusBadge } from '../../components/ui';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminCategoryItem } from '../../types/admin';

export function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setCategories(await adminService.listCategories());
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar categorias',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function openCreate() {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(cat: AdminCategoryItem) {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setIsActive(cat.isActive);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await adminService.updateCategory(editing.id, { name, slug, description, isActive });
      } else {
        await adminService.createCategory({ name, slug, description, isActive });
      }
      setModalOpen(false);
      showToast({ type: 'success', title: 'Categoria salva com sucesso' });
      await loadCategories();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar categoria',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Categorias" subtitle="Gerencie as oito categorias oficiais e visibilidade.">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreate}>+ Adicionar categoria</Button>
        </div>

        <DataTable
          data={categories}
          loading={loading}
          keyExtractor={(c) => c.id}
          columns={[
            {
              key: 'name',
              header: 'Nome',
              render: (c) => (
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-brand-muted">{c.description}</p>
                </div>
              ),
            },
            {
              key: 'books',
              header: 'Livros',
              render: (c) => c._count?.books ?? 0,
            },
            {
              key: 'status',
              header: 'Status',
              render: (c) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'ARCHIVED'} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              render: (c) => (
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await adminService.updateCategory(c.id, { isActive: !c.isActive });
                      await loadCategories();
                    }}
                  >
                    {c.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
        title={editing ? 'Gerenciar categoria' : 'Nova categoria'}
      >
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <Input
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <Checkbox label="Categoria ativa" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </FormModal>
    </AdminLayout>
  );
}
