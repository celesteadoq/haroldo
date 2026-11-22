import { OfflineBookStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { BookAccessService } from './bookAccess.service';
import { NotificationService } from './notification.service';
import { SubscriptionService } from './subscription.service';
import { resolveCoverUrl } from '../utils/cover';

export class OfflineService {
  constructor(
    private readonly subscriptionService = new SubscriptionService(),
    private readonly bookAccessService = new BookAccessService(),
    private readonly notificationService = new NotificationService()
  ) {}

  async listOfflineBooks(userId: string) {
    const sub = await this.subscriptionService.reconcileUserSubscription(userId);
    const items = await prisma.offlineBook.findMany({
      where: {
        userId,
        status: { not: OfflineBookStatus.REVOKED },
        book: { isActive: true },
      },
      orderBy: { syncedAt: 'desc' },
      include: {
        book: {
          include: {
            authors: { include: { author: { select: { name: true, slug: true } } } },
            categories: { include: { category: { select: { name: true, slug: true } } } },
          },
        },
      },
    });

    return {
      limit: sub?.plan.offlineBookLimit ?? 0,
      hasOfflineReading: sub?.plan.hasOfflineReading ?? false,
      used: items.length,
      items: items.map((row) => ({
        id: row.id,
        bookId: row.bookId,
        status: row.status,
        syncedAt: row.syncedAt,
        book: {
          id: row.book.id,
          title: row.book.title,
          slug: row.book.slug,
          coverImage: resolveCoverUrl(row.book.coverUrl, row.book.slug),
          hasFullContent: row.book.hasFullContent,
          authors: row.book.authors.map((a) => a.author),
          categories: row.book.categories.map((c) => c.category),
        },
      })),
    };
  }

  async addOfflineBook(userId: string, bookId: string, deviceId?: string) {
    const [sub, book, userContext] = await Promise.all([
      this.subscriptionService.reconcileUserSubscription(userId),
      prisma.book.findFirst({ where: { id: bookId, isActive: true } }),
      this.bookAccessService.getUserPlanContext(userId),
    ]);

    if (!book) throw new AppError('Livro não encontrado.', 404);

    if (!sub?.plan.hasOfflineReading || sub.plan.offlineBookLimit <= 0) {
      throw new AppError(
        'Seu plano atual não inclui leitura offline. Conheça os planos Básico ou Premium.',
        403,
        { code: 'OFFLINE_NOT_ALLOWED' }
      );
    }

    const access = this.bookAccessService.evaluateBookAccess(book, userContext);
    if (!access.canReadFull || !book.hasFullContent) {
      throw new AppError(
        'Apenas livros com conteúdo completo disponível e autorizado para seu plano podem ser salvos offline.',
        403,
        { code: 'OFFLINE_BOOK_NOT_AUTHORIZED' }
      );
    }

    const existing = await prisma.offlineBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (existing && existing.status !== OfflineBookStatus.REVOKED) {
      return existing;
    }

    const activeCount = await prisma.offlineBook.count({
      where: { userId, status: { not: OfflineBookStatus.REVOKED } },
    });

    if (activeCount >= sub.plan.offlineBookLimit) {
      await this.notificationService.createUnique({
        userId,
        category: 'OFFLINE',
        title: 'Limite de livros offline atingido',
        message: `Você atingiu o limite de ${sub.plan.offlineBookLimit} livro(s) offline do plano ${sub.plan.name}.`,
        actionUrl: '/biblioteca',
        dedupeKey: `offline-limit-${sub.id}-${activeCount}`,
      });

      throw new AppError(
        `Limite de ${sub.plan.offlineBookLimit} livro(s) offline atingido no plano ${sub.plan.name}.`,
        403,
        { code: 'OFFLINE_LIMIT_REACHED' }
      );
    }

    return prisma.offlineBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {
        status: OfflineBookStatus.METADATA_CACHED,
        deviceId: deviceId ?? null,
        syncedAt: new Date(),
      },
      create: {
        userId,
        bookId,
        deviceId: deviceId ?? null,
        status: OfflineBookStatus.METADATA_CACHED,
      },
    });
  }

  async removeOfflineBook(userId: string, bookId: string) {
    const deleted = await prisma.offlineBook.deleteMany({
      where: { userId, bookId },
    });

    if (deleted.count === 0) {
      throw new AppError('Livro não encontrado na lista offline.', 404);
    }
  }
}
