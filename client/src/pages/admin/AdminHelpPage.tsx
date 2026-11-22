import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, DataTable } from '../../components/admin';
import { FormModal, useToast } from '../../components/feedback';
import { Button, Checkbox, Input, Select, StatusBadge, Textarea } from '../../components/ui';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminHelpArticleItem } from '../../types/admin';

const HELP_CATEGORIES = [
  'Conta e cadastro',
  'Planos e assinaturas',
  'Pagamentos',
  'Leitura e biblioteca',
  'Dispositivos',
  'Problemas técnicos',
];

export function AdminHelpPage() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<AdminHelpArticleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminHelpArticleItem | null>(null);
  const [category, setCategory] = useState(HELP_CATEGORIES[0]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminHelpArticleItem | null>(null);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setArticles(await adminService.listHelpArticles());
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar artigos',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  function openCreate() {
    setEditing(null);
    setCategory(HELP_CATEGORIES[0]);
    setQuestion('');
    setAnswer('');
    setDisplayOrder(String(articles.length + 1));
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(item: AdminHelpArticleItem) {
    setEditing(item);
    setCategory(item.category);
    setQuestion(item.question);
    setAnswer(item.answer);
    setDisplayOrder(String(item.displayOrder));
    setIsActive(item.isActive);
    setModalOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        category,
        question,
        answer,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      };
      if (editing) {
        await adminService.updateHelpArticle(editing.id, payload);
      } else {
        await adminService.createHelpArticle(payload);
      }
      setModalOpen(false);
      showToast({ type: 'success', title: 'Artigo salvo com sucesso' });
      await loadArticles();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar artigo',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Central de ajuda" subtitle="Gerencie perguntas frequentes exibidas em /ajuda.">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreate}>+ Novo artigo</Button>
        </div>

        <DataTable
          data={articles}
          loading={loading}
          keyExtractor={(a) => a.id}
          columns={[
            {
              key: 'question',
              header: 'Pergunta',
              render: (a) => (
                <div>
                  <p className="font-semibold text-white">{a.question}</p>
                  <p className="text-xs text-brand-muted">{a.category}</p>
                </div>
              ),
            },
            { key: 'order', header: 'Ordem', render: (a) => a.displayOrder },
            {
              key: 'status',
              header: 'Status',
              render: (a) => <StatusBadge status={a.isActive ? 'PUBLISHED' : 'ARCHIVED'} />,
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
        onSubmit={handleSave}
        loading={saving}
        title={editing ? 'Editar pergunta' : 'Nova pergunta'}
      >
        <Select
          label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={HELP_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Input
          label="Pergunta"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
        <Textarea
          label="Resposta"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
        <Input
          label="Ordem de exibição"
          type="number"
          min="0"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
        />
        <Checkbox label="Ativo na central pública" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await adminService.deleteHelpArticle(deleteTarget.id);
          setDeleteTarget(null);
          showToast({ type: 'info', title: 'Artigo excluído' });
          await loadArticles();
        }}
        title="Excluir artigo de ajuda?"
        description="Ele deixará de aparecer imediatamente na página pública /ajuda."
      />
    </AdminLayout>
  );
}
