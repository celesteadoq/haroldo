import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FormModal, useToast } from '../../components/feedback';
import { Badge, Button, Checkbox, Input, Skeleton } from '../../components/ui';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminPlanItem } from '../../types/admin';

export function AdminPlansPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<AdminPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<AdminPlanItem | null>(null);
  const [description, setDescription] = useState('');
  const [maxDevices, setMaxDevices] = useState('1');
  const [offlineBookLimit, setOfflineBookLimit] = useState('0');
  const [hasAds, setHasAds] = useState(true);
  const [hasOfflineReading, setHasOfflineReading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setPlans(await adminService.listPlans());
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar planos',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  function openEdit(plan: AdminPlanItem) {
    setEditing(plan);
    setDescription(plan.description);
    setMaxDevices(String(plan.maxDevices));
    setOfflineBookLimit(String(plan.offlineBookLimit));
    setHasAds(plan.hasAds);
    setHasOfflineReading(plan.hasOfflineReading);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      await adminService.updatePlan(editing.id, {
        description,
        maxDevices: Number(maxDevices),
        offlineBookLimit: Number(offlineBookLimit),
        hasAds,
        hasOfflineReading,
      });
      setEditing(null);
      showToast({ type: 'success', title: 'Plano atualizado' });
      await loadPlans();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar plano',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout
      title="Planos"
      subtitle="Preços oficiais preservados (Gratuito R$ 0,00 • Básico R$ 19,90 • Premium R$ 34,90)."
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-xl border border-brand-border bg-brand-surface p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  <Badge variant="neutral">{plan._count?.subscriptions ?? 0} ativo(s)</Badge>
                </div>
                <p className="text-3xl font-extrabold text-white">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                  <span className="text-xs font-normal text-brand-muted"> /mês</span>
                </p>
                <p className="text-xs text-brand-muted">{plan.description}</p>
                <ul className="text-xs text-gray-200 space-y-1.5 pt-2">
                  <li>• Dispositivos: {plan.maxDevices}</li>
                  <li>• Livros offline: {plan.offlineBookLimit}</li>
                  <li>• Anúncios: {plan.hasAds ? 'Sim' : 'Não'}</li>
                  <li>• Leitura offline: {plan.hasOfflineReading ? 'Habilitada' : 'Desabilitada'}</li>
                </ul>
              </div>
              <Button variant="outline" fullWidth onClick={() => openEdit(plan)}>
                Editar limites e descrição
              </Button>
            </article>
          ))}
        </div>
      )}

      <FormModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
        loading={saving}
        title={`Editar plano ${editing?.name ?? ''}`}
        description="Alterações não modificam retroativamente pagamentos históricos."
      >
        <Input
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <Input
          label="Máximo de dispositivos"
          type="number"
          min="1"
          max="10"
          value={maxDevices}
          onChange={(e) => setMaxDevices(e.target.value)}
          required
        />
        <Input
          label="Limite de livros offline"
          type="number"
          min="0"
          max="50"
          value={offlineBookLimit}
          onChange={(e) => setOfflineBookLimit(e.target.value)}
          required
        />
        <Checkbox label="Exibir anúncios" checked={hasAds} onChange={(e) => setHasAds(e.target.checked)} />
        <Checkbox
          label="Permitir leitura offline"
          checked={hasOfflineReading}
          onChange={(e) => setHasOfflineReading(e.target.checked)}
        />
      </FormModal>
    </AdminLayout>
  );
}
