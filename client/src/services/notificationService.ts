import { api } from './api';
import type { NotificationItem } from '../types/subscription';

export const notificationService = {
  async list(unreadOnly = false): Promise<{ items: NotificationItem[]; unreadCount: number }> {
    const { data } = await api.get<{ items: NotificationItem[]; unreadCount: number }>(
      '/notifications',
      { params: { unreadOnly: String(unreadOnly) } }
    );
    return data;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const { data } = await api.patch<{ item: NotificationItem }>(`/notifications/${id}/read`);
    return data.item;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
