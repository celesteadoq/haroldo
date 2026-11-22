import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ConfirmModal,
  FormModal,
  SuccessModal,
  useToast,
} from '../components/feedback';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  PasswordInput,
  Select,
  StatusBadge,
} from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import { accountService } from '../services/accountService';
import type { ConnectedDevice } from '../types/auth';

export function AccountPage() {
  const { user, setUserData, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState<'pt-BR' | 'en-US'>(
    (user?.preferredLanguage as 'pt-BR' | 'en-US') || 'pt-BR'
  );
  const [preferredTheme, setPreferredTheme] = useState<'dark' | 'sepia'>(
    (user?.preferredTheme as 'dark' | 'sepia') || 'dark'
  );
  const [emailNotifications, setEmailNotifications] = useState(
    user?.emailNotifications ?? true
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [maxDevices, setMaxDevices] = useState<number>(1);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceToDisconnect, setDeviceToDisconnect] = useState<ConnectedDevice | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPreferredLanguage((user.preferredLanguage as 'pt-BR' | 'en-US') || 'pt-BR');
      setPreferredTheme((user.preferredTheme as 'dark' | 'sepia') || 'dark');
      setEmailNotifications(user.emailNotifications);
    }
  }, [user]);

  const loadDevices = useCallback(async () => {
    try {
      setLoadingDevices(true);
      const res = await accountService.listDevices();
      setDevices(res.devices);
      setMaxDevices(res.maxDevices);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar dispositivos',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoadingDevices(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      showToast({ type: 'error', title: 'Informe um nome válido.' });
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await accountService.updateProfile({
        name,
        preferredLanguage,
        preferredTheme,
        emailNotifications,
      });
      setUserData(updated);
      setSavedModalOpen(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar perfil',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError('A nova senha deve possuir no mínimo 8 caracteres, letras e números.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }

    try {
      setChangingPassword(true);
      await accountService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast({
        type: 'success',
        title: 'Senha alterada',
        message: 'Sua nova senha já está em vigor.',
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleConfirmDisconnect() {
    if (!deviceToDisconnect) return;
    try {
      setDisconnecting(true);
      const res = await accountService.disconnectDevice(deviceToDisconnect.id);
      setDeviceToDisconnect(null);

      if (res.disconnectedCurrentDevice) {
        await logout();
        navigate('/entrar', { replace: true });
        return;
      }

      showToast({
        type: 'info',
        title: 'Dispositivo desconectado',
        message: 'O acesso remoto foi encerrado.',
      });
      await loadDevices();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao desconectar dispositivo',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDisconnecting(false);
    }
  }

  if (!user) return null;

  const plan = user.currentSubscription?.plan;

  return (
    <UserLayout
      authState={user.role === 'ADMIN' ? 'admin' : 'user'}
      userName={user.name}
      onLogout={() => void logout()}
    >
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Meu perfil</h1>
              <p className="text-sm text-brand-muted">
                Sua conta, suas preferências e seus dispositivos.
              </p>
              <p className="mt-1 text-xs text-brand-subtle">
                Membro desde{' '}
                {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'ADMIN' && <Badge variant="primary">Administrador</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                navigate('/entrar', { replace: true });
              }}
            >
              Sair da conta
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Dados pessoais</h2>

            <Input
              label="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="E-mail"
              value={user.email}
              disabled
              helperText="O e-mail é somente leitura nesta etapa."
            />

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(true)}
              >
                Alterar senha
              </Button>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={savingProfile}>
              Salvar alterações
            </Button>
          </section>

          <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Do seu jeito</h2>

            <Select
              label="Idioma"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as 'pt-BR' | 'en-US')}
              options={[
                { value: 'pt-BR', label: 'Português (Brasil)' },
                { value: 'en-US', label: 'English (US)' },
              ]}
            />

            <Select
              label="Tema padrão do leitor"
              value={preferredTheme}
              onChange={(e) => setPreferredTheme(e.target.value as 'dark' | 'sepia')}
              options={[
                { value: 'dark', label: 'Escuro' },
                { value: 'sepia', label: 'Sépia' },
              ]}
            />

            <Select
              label="E-mails e notificações"
              value={emailNotifications ? 'enabled' : 'disabled'}
              onChange={(e) => setEmailNotifications(e.target.value === 'enabled')}
              options={[
                { value: 'enabled', label: 'Novidades e lembretes ativados' },
                { value: 'disabled', label: 'Somente avisos essenciais' },
              ]}
            />

            <div className="rounded-lg border border-brand-border bg-brand-bg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-brand-subtle uppercase tracking-wider font-bold">
                    Assinatura atual
                  </p>
                  <p className="mt-1 text-base font-bold text-white">
                    {plan
                      ? `${plan.name} • R$ ${plan.price.toFixed(2).replace('.', ',')}/mês`
                      : 'Gratuito'}
                  </p>
                </div>
                {user.currentSubscription && (
                  <StatusBadge status={user.currentSubscription.status} />
                )}
              </div>
              {plan && (
                <p className="text-xs text-brand-muted">
                  Limite: {plan.maxDevices} dispositivo(s) • Offline: {plan.offlineBookLimit} livro(s)
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/minha-assinatura')}
                >
                  Gerenciar assinatura
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => navigate('/ajuda')}>
                  Central de ajuda
                </Button>
              </div>
            </div>
          </section>
        </form>

        <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Dispositivos conectados</h2>
            <p className="text-xs text-brand-muted">
              {devices.length} de {maxDevices} dispositivo(s) em uso no seu plano.
            </p>
          </div>

          {loadingDevices ? (
            <p className="text-sm text-brand-muted">Carregando dispositivos...</p>
          ) : devices.length === 0 ? (
            <EmptyState
              title="Nenhum dispositivo ativo."
              description="Seus dispositivos conectados aparecerão aqui."
            />
          ) : (
            <div className="divide-y divide-brand-border">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col justify-between gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{device.deviceName}</p>
                      {device.isCurrent && <Badge variant="primary">Este dispositivo</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-brand-subtle">
                      Primeiro acesso: {new Date(device.firstAccessAt).toLocaleString('pt-BR')} •
                      Último acesso: {new Date(device.lastActiveAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeviceToDisconnect(device)}
                  >
                    Desconectar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <SuccessModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        title="Tudo atualizado."
        description="Suas alterações de perfil foram salvas."
        primaryLabel="Continuar"
      />

      <ConfirmModal
        isOpen={Boolean(deviceToDisconnect)}
        onClose={() => setDeviceToDisconnect(null)}
        onConfirm={handleConfirmDisconnect}
        loading={disconnecting}
        title="Desconectar dispositivo?"
        description={`${deviceToDisconnect?.deviceName ?? 'Este dispositivo'} perderá o acesso. Será necessário entrar novamente nesse dispositivo.`}
        confirmLabel="Sim, desconectar"
        cancelLabel="Manter conectado"
      />

      <FormModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
        loading={changingPassword}
        title="Alterar senha"
        description="Escolha uma nova senha segura com letras e números."
        submitLabel="Salvar nova senha"
      >
        <PasswordInput
          label="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Nova senha"
          helperText="Mínimo de 8 caracteres, letras e números."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Confirmar nova senha"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
        />
        {passwordError && (
          <p role="alert" className="text-xs text-brand-accent">
            {passwordError}
          </p>
        )}
      </FormModal>
    </UserLayout>
  );
}
