import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export class NotificationService {
  async createUnique(params: {
    userId: string;
    category: string;
    title: string;
    message: string;
    actionUrl?: string;
    dedupeKey?: string;
  }) {
    if (params.dedupeKey) {
      const existing = await prisma.notification.findUnique({
        where: {
          userId_dedupeKey: {
            userId: params.userId,
            dedupeKey: params.dedupeKey,
          },
        },
      });
      if (existing) return existing;
    }

    return prisma.notification.create({
      data: {
        userId: params.userId,
        category: params.category,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl ?? null,
        dedupeKey: params.dedupeKey ?? null,
      },
    });
  }

  async listForUser(userId: string, unreadOnly = false) {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('Notificação não encontrada.', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
