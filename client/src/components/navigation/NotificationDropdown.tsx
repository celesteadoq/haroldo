import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import type { NotificationItem } from '../../types/subscription';
import { Button } from '../ui';

export interface NotificationDropdownProps {
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationDropdown({ onUnreadCountChange }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.list(false);
      setItems(data.items.slice(0, 5));
      setUnreadCount(data.unreadCount);
      onUnreadCountChange?.(data.unreadCount);
    } catch {
      // Silencioso no dropdown para não interromper navegação
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  async function handleMarkAsRead(id: string) {
    try {
      await notificationService.markAsRead(id);
      await loadNotifications();
    } catch {
      // Ignora erro pontual
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void loadNotifications();
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-white transition-colors"
      >
        <span>Avisos</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
            unreadCount > 0 ? 'bg-brand-primary text-white' : 'bg-brand-elevated text-brand-muted'
          }`}
        >
          {unreadCount}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-brand-border bg-brand-surface p-4 shadow-modal z-50">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Notificações</p>
            <Link
              to="/notificacoes"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand-accent hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-brand-muted py-4 text-center">Carregando avisos...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-brand-muted py-4 text-center">Tudo em dia por aqui.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 text-xs ${
                    item.isRead
                      ? 'border-brand-border bg-brand-bg/50 text-brand-muted'
                      : 'border-brand-primary/40 bg-brand-bg text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-brand-accent">
                      {item.isRead ? '✓' : '•'} {item.category}
                    </span>
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAsRead(item.id)}
                        className="text-[11px] text-brand-muted hover:text-white"
                      >
                        Marcar lida
                      </button>
                    )}
                  </div>
                  <p className="mt-1 font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-brand-muted line-clamp-2">{item.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-brand-border">
            <Link to="/notificacoes" onClick={() => setOpen(false)}>
              <Button size="sm" variant="outline" fullWidth>
                Abrir central de notificações
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
