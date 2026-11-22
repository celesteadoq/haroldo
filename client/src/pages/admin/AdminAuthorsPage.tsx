import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, DataTable, Filters } from '../../components/admin';
import { FormModal, useToast } from '../../components/feedback';
import { Button, Input, Textarea } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminAuthorItem } from '../../types/admin';

export function AdminAuthorsPage() {
  const { showToast } = useToast();
  const [authors, setAuthors] = useState<AdminAuthorItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<AdminAuthorItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [biography, setBiography] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAuthorItem | null>(null);

  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      setAuthors(await adminService.listAuthors(debouncedSearch || undefined));
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar autores',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showToast]);

  useEffect(() => {
    void loadAuthors();
  }, [loadAuthors]);

  function openCreate() {
    setEditing(null);
    setName('');
    setSlug('');
    setBiography('');
    setPhotoUrl('');
    setModalOpen(true);
  }

  function openEdit(author: AdminAuthorItem) {
    setEditing(author);
    setName(author.name);
    setSlug(author.slug);
    setBiography(author.biography ?? '');
    setPhotoUrl(author.photoUrl ?? '');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name,
        slug,
        biography: biography.trim() || null,
        photoUrl: photoUrl.trim() || null,
      };
      if (editing) {
        await adminService.updateAuthor(editing.id, payload);
      } else {
        await adminService.createAuthor(payload);
      }
      setModalOpen(false);
      showToast({ type: 'success', title: 'Autor salvo com sucesso' });
      await loadAuthors();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar autor',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Autores" subtitle="Cadastre e gerencie autores vinculados ao catálogo.">
      <div className="space-y-6">
        <Filters
          searchValue={search}
          searchPlaceholder="Buscar autores..."
          onSearchChange={setSearch}
          onClear={() => setSearch('')}
          actions={<Button onClick={openCreate}>+ Adicionar autor</Button>}
        />

        <DataTable
          data={authors}
          loading={loading}
          keyExtractor={(a) => a.id}
          columns={[
            {
              key: 'name',
              header: 'Autor',
              render: (a) => (
                <div>
                  <p className="font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-brand-subtle">/{a.slug}</p>
                </div>
              ),
            },
            {
              key: 'books',
              header: 'Obras',
              render: (a) => a._count?.books ?? a.books?.length ?? 0,
            },
            {
              key: 'actions',
              header: 'Ações',
              render: (a) => (
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>
                    Excluir
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
        title={editing ? 'Editar autor' : 'Novo autor'}
      >
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <Input label="URL da foto (opcional)" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        <Textarea label="Biografia" value={biography} onChange={(e) => setBiography(e.target.value)} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await adminService.deleteAuthor(deleteTarget.id);
            setDeleteTarget(null);
            showToast({ type: 'info', title: 'Autor excluído' });
            await loadAuthors();
          } catch (err) {
            setDeleteTarget(null);
            showToast({
              type: 'error',
              title: 'Não foi possível excluir',
              message: err instanceof Error ? err.message : undefined,
            });
          }
        }}
        title="Excluir autor?"
        description={`Autores vinculados a livros não podem ser excluídos.`}
      />
    </AdminLayout>
  );
}
