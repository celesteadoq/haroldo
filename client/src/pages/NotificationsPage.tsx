import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/feedback';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import { notificationService } from '../services/notificationService';
import type { NotificationItem } from '../types/subscription';

export function NotificationsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await notificationService.list(unreadOnly);
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleMarkRead(id: string) {
    try {
      await notificationService.markAsRead(id);
      await loadNotifications();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar notificação',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllAsRead();
      showToast({ type: 'success', title: 'Todas as notificações marcadas como lidas' });
      await loadNotifications();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao marcar notificações',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  if (!user) return null;

  return (
    <UserLayout
      authState={user.role === 'ADMIN' ? 'admin' : 'user'}
      userName={user.name}
      unreadNotificationsCount={unreadCount}
      onLogout={() => void logout()}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Suas notificações</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Novidades e informações importantes sobre sua assinatura e conta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant={!unreadOnly ? 'primary' : 'secondary'}
            onClick={() => setUnreadOnly(false)}
          >
            Todas ({items.length})
          </Button>
          <Button
            size="sm"
            variant={unreadOnly ? 'primary' : 'secondary'}
            onClick={() => setUnreadOnly(true)}
          >
            Ver não lidas ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={() => void handleMarkAllRead()}>
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : errorMsg ? (
          <EmptyState
            eyebrow="ERRO"
            title="Não foi possível carregar suas notificações."
            description={errorMsg}
            action={<Button onClick={() => void loadNotifications()}>Tentar novamente</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Tudo em dia por aqui."
            description={
              unreadOnly
                ? 'Você não tem notificações não lidas. Volte para uma boa história.'
                : 'Nenhuma notificação registrada até o momento.'
            }
            action={
              unreadOnly ? (
                <Button onClick={() => setUnreadOnly(false)}>Ver todas as notificações</Button>
              ) : (
                <Button onClick={() => navigate('/catalogo')}>Explorar catálogo</Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border p-5 space-y-2 ${
                  item.isRead
                    ? 'border-brand-border bg-brand-surface/60'
                    : 'border-brand-primary/50 bg-brand-surface'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-brand-accent">
                    {item.isRead ? '✓' : '•'} {item.category}
                  </span>
                  <span className="text-brand-subtle">
                    {new Date(item.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white">{item.title}</h2>
                <p className="text-sm text-brand-muted">{item.message}</p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {item.actionUrl && (
                    <button
                      type="button"
                      onClick={() => navigate(item.actionUrl!)}
                      className="text-xs font-semibold text-brand-accent hover:underline"
                    >
                      Ver detalhes →
                    </button>
                  )}
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(item.id)}
                      className="text-xs font-medium text-brand-muted hover:text-white"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
