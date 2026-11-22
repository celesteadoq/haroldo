import { Prisma, ReadingStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { BookAccessService, type UserPlanContext } from './bookAccess.service';
import { resolveCoverUrl } from '../utils/cover';

const bookSummaryInclude = {
  authors: {
    include: {
      author: { select: { id: true, name: true, slug: true } },
    },
  },
  categories: {
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  previewPages: {
    select: { id: true },
  },
} satisfies Prisma.BookInclude;

export class LibraryService {
  constructor(private readonly bookAccessService = new BookAccessService()) {}

  private mapBookCardData(
    book: Prisma.BookGetPayload<{ include: typeof bookSummaryInclude }>,
    userContext: UserPlanContext,
    favoriteIds: Set<string>
  ) {
    return {
      id: book.id,
      title: book.title,
      slug: book.slug,
      coverImage: resolveCoverUrl(book.coverUrl, book.slug),
      averageRating: book.averageRating > 0 ? book.averageRating : null,
      isFreeEligible: book.isFreeEligible,
      hasFullContent: book.hasFullContent,
      pageCount: book.pageCount ?? null,
      access: this.bookAccessService.evaluateBookAccess(book, userContext),
      isFavorite: favoriteIds.has(book.id),
      authors: book.authors.map((a) => a.author),
      categories: book.categories.map((c) => c.category),
    };
  }

  async getLibrary(userId: string, statusFilter?: ReadingStatus) {
    const [userContext, favorites, allProgress, allLibraryCounts] = await Promise.all([
      this.bookAccessService.getUserPlanContext(userId),
      prisma.favorite.findMany({ where: { userId }, select: { bookId: true } }),
      prisma.readingProgress.findMany({
        where: {
          userId,
          inLibrary: true,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        include: {
          book: { include: bookSummaryInclude },
        },
        orderBy: [{ lastReadAt: 'desc' }, { updatedAt: 'desc' }],
      }),
      prisma.readingProgress.groupBy({
        by: ['status'],
        where: { userId, inLibrary: true },
        _count: { _all: true },
      }),
    ]);

    const favoriteIds = new Set(favorites.map((f) => f.bookId));

    const counts = {
      ALL: 0,
      WANT_TO_READ: 0,
      READING: 0,
      COMPLETED: 0,
      FAVORITES: favoriteIds.size,
    };

    for (const row of allLibraryCounts) {
      counts[row.status] = row._count._all;
      counts.ALL += row._count._all;
    }

    const stats = await this.getPersonalStatistics(userId);

    return {
      items: allProgress.map((item) => ({
        id: item.id,
        bookId: item.bookId,
        status: item.status,
        currentPage: item.currentPage,
        totalPages: item.totalPages,
        progressPercentage: item.progressPercentage,
        readingTimeSeconds: item.readingTimeSeconds,
        lastReadAt: item.lastReadAt,
        completedAt: item.completedAt,
        book: this.mapBookCardData(item.book, userContext, favoriteIds),
      })),
      counts,
      stats,
    };
  }

  async addToLibrary(
    userId: string,
    bookId: string,
    desiredStatus: ReadingStatus = ReadingStatus.WANT_TO_READ
  ) {
    const [book, userContext] = await Promise.all([
      prisma.book.findFirst({
        where: { id: bookId, isActive: true },
        include: { previewPages: { select: { id: true } } },
      }),
      this.bookAccessService.getUserPlanContext(userId),
    ]);

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    const access = this.bookAccessService.evaluateBookAccess(book, userContext);
    if (desiredStatus === ReadingStatus.COMPLETED && (!book.hasFullContent || !access.canReadFull)) {
      throw new AppError(
        'Este livro não possui conteúdo completo autorizado para ser marcado como concluído.',
        400,
        { code: 'FULL_CONTENT_UNAVAILABLE' }
      );
    }

    const availableTotalPages = book.hasFullContent
      ? Math.max(1, book.pageCount ?? book.previewPages.length)
      : Math.max(1, book.previewPages.length || 1);

    const existing = await prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (existing) {
      return prisma.readingProgress.update({
        where: { id: existing.id },
        data: {
          inLibrary: true,
          status: desiredStatus,
          ...(desiredStatus === ReadingStatus.COMPLETED
            ? {
                currentPage: availableTotalPages,
                totalPages: availableTotalPages,
                progressPercentage: 100,
                completedAt: existing.completedAt ?? new Date(),
              }
            : {}),
        },
      });
    }

    return prisma.readingProgress.create({
      data: {
        userId,
        bookId,
        inLibrary: true,
        status: desiredStatus,
        currentPage: desiredStatus === ReadingStatus.COMPLETED ? availableTotalPages : 0,
        totalPages: availableTotalPages,
        progressPercentage: desiredStatus === ReadingStatus.COMPLETED ? 100 : 0,
        completedAt: desiredStatus === ReadingStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  async updateLibraryStatus(userId: string, bookId: string, status: ReadingStatus) {
    const [existing, book, userContext] = await Promise.all([
      prisma.readingProgress.findUnique({
        where: { userId_bookId: { userId, bookId } },
      }),
      prisma.book.findFirst({
        where: { id: bookId, isActive: true },
        include: { previewPages: { select: { id: true } } },
      }),
      this.bookAccessService.getUserPlanContext(userId),
    ]);

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    if (!existing || !existing.inLibrary) {
      throw new AppError('Este livro não está na sua biblioteca.', 404);
    }

    const access = this.bookAccessService.evaluateBookAccess(book, userContext);

    if (status === ReadingStatus.COMPLETED && (!book.hasFullContent || !access.canReadFull)) {
      throw new AppError(
        'Apenas livros com conteúdo completo disponível e autorizado para o seu plano podem ser marcados como concluídos.',
        400,
        { code: 'FULL_CONTENT_UNAVAILABLE' }
      );
    }

    const availableTotalPages = book.hasFullContent
      ? Math.max(1, book.pageCount ?? book.previewPages.length)
      : Math.max(1, book.previewPages.length || 1);

    return prisma.readingProgress.update({
      where: { id: existing.id },
      data: {
        status,
        ...(status === ReadingStatus.COMPLETED
          ? {
              currentPage: availableTotalPages,
              totalPages: availableTotalPages,
              progressPercentage: 100,
              completedAt: new Date(),
            }
          : {
              completedAt: null,
            }),
      },
    });
  }

  async removeFromLibrary(userId: string, bookId: string) {
    const existing = await prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing || !existing.inLibrary) {
      throw new AppError('Livro não encontrado na biblioteca.', 404);
    }

    await prisma.readingProgress.update({
      where: { id: existing.id },
      data: { inLibrary: false },
    });
  }

  async listFavorites(userId: string) {
    const [userContext, favorites] = await Promise.all([
      this.bookAccessService.getUserPlanContext(userId),
      prisma.favorite.findMany({
        where: { userId, book: { isActive: true } },
        include: { book: { include: bookSummaryInclude } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const favoriteIds = new Set(favorites.map((f) => f.bookId));

    return favorites.map((fav) => ({
      id: fav.id,
      favoritedAt: fav.createdAt,
      book: this.mapBookCardData(fav.book, userContext, favoriteIds),
    }));
  }

  async getReadingHistory(userId: string) {
    const [userContext, favorites, historyRows] = await Promise.all([
      this.bookAccessService.getUserPlanContext(userId),
      prisma.favorite.findMany({ where: { userId }, select: { bookId: true } }),
      prisma.readingHistory.findMany({
        where: { userId, book: { isActive: true } },
        include: { book: { include: bookSummaryInclude } },
        orderBy: { lastReadAt: 'desc' },
      }),
    ]);

    const favoriteIds = new Set(favorites.map((f) => f.bookId));

    return historyRows.map((row) => ({
      id: row.id,
      bookId: row.bookId,
      lastPage: row.lastPage,
      totalPages: row.totalPages,
      progressPercentage: row.progressPercentage,
      readingTimeSeconds: row.readingTimeSeconds,
      lastReadAt: row.lastReadAt,
      book: this.mapBookCardData(row.book, userContext, favoriteIds),
    }));
  }

  async removeHistoryEntry(userId: string, bookId: string) {
    const deleted = await prisma.readingHistory.deleteMany({
      where: { userId, bookId },
    });

    if (deleted.count === 0) {
      throw new AppError('Registro de histórico não encontrado.', 404);
    }
  }

  async listAllProgress(userId: string) {
    const [rows, stats] = await Promise.all([
      prisma.readingProgress.findMany({
        where: { userId, book: { isActive: true } },
        include: { book: { include: bookSummaryInclude } },
        orderBy: { lastReadAt: 'desc' },
      }),
      this.getPersonalStatistics(userId),
    ]);

    return { items: rows, stats };
  }

  async getBookProgress(userId: string, bookId: string) {
    const progress = await prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    return progress ?? null;
  }

  async saveBookProgress(params: {
    userId: string;
    bookId: string;
    currentPage: number;
    readingSecondsDelta?: number;
    clientTimestamp?: string;
  }) {
    const { userId, bookId, currentPage, readingSecondsDelta = 0, clientTimestamp } = params;

    const [book, userContext] = await Promise.all([
      prisma.book.findFirst({
        where: { id: bookId, isActive: true },
        include: { previewPages: { orderBy: { pageNumber: 'asc' } } },
      }),
      this.bookAccessService.getUserPlanContext(userId),
    ]);

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    const access = this.bookAccessService.evaluateBookAccess(book, userContext);
    if (!access.canReadPreview && !access.canReadFull) {
      throw new AppError(
        'Você não possui permissão no plano atual para registrar leitura deste título.',
        403,
        { code: 'BOOK_ACCESS_RESTRICTED' }
      );
    }

    const availableTotalPages =
      book.hasFullContent && access.canReadFull
        ? Math.max(1, book.pageCount ?? book.previewPages.length)
        : Math.max(1, Math.min(2, book.previewPages.length || 1));

    const clampedPage = Math.min(availableTotalPages, Math.max(1, Math.trunc(currentPage)));
    const safeDeltaSeconds = Math.min(300, Math.max(0, Math.trunc(readingSecondsDelta)));
    const calculatedPercentage = Math.min(
      100,
      Math.max(0, Math.round((clampedPage / availableTotalPages) * 100))
    );

    const existing = await prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (existing && clientTimestamp) {
      const clientDate = new Date(clientTimestamp);
      if (!Number.isNaN(clientDate.getTime()) && clientDate < existing.lastReadAt) {
        return {
          conflictResolved: true,
          progress: existing,
        };
      }
    }

    const canAutoComplete =
      book.hasFullContent && access.canReadFull && clampedPage >= availableTotalPages;

    const nextStatus: ReadingStatus = canAutoComplete
      ? ReadingStatus.COMPLETED
      : existing?.status === ReadingStatus.COMPLETED
        ? ReadingStatus.COMPLETED
        : ReadingStatus.READING;

    const now = new Date();

    const updatedProgress = await prisma.$transaction(async (tx) => {
      const progress = await tx.readingProgress.upsert({
        where: { userId_bookId: { userId, bookId } },
        update: {
          currentPage: clampedPage,
          totalPages: availableTotalPages,
          progressPercentage: calculatedPercentage,
          status: nextStatus,
          inLibrary: true,
          readingTimeSeconds: { increment: safeDeltaSeconds },
          lastReadAt: now,
          ...(canAutoComplete ? { completedAt: existing?.completedAt ?? now } : {}),
        },
        create: {
          userId,
          bookId,
          currentPage: clampedPage,
          totalPages: availableTotalPages,
          progressPercentage: calculatedPercentage,
          status: nextStatus,
          inLibrary: true,
          readingTimeSeconds: safeDeltaSeconds,
          lastReadAt: now,
          completedAt: canAutoComplete ? now : null,
        },
      });

      await tx.readingHistory.upsert({
        where: { userId_bookId: { userId, bookId } },
        update: {
          lastPage: clampedPage,
          totalPages: availableTotalPages,
          progressPercentage: calculatedPercentage,
          readingTimeSeconds: { increment: safeDeltaSeconds },
          lastReadAt: now,
        },
        create: {
          userId,
          bookId,
          lastPage: clampedPage,
          totalPages: availableTotalPages,
          progressPercentage: calculatedPercentage,
          readingTimeSeconds: safeDeltaSeconds,
          lastReadAt: now,
        },
      });

      return progress;
    });

    return {
      conflictResolved: false,
      progress: updatedProgress,
    };
  }

  async getPersonalStatistics(userId: string) {
    const [progressRows, recentHistory] = await Promise.all([
      prisma.readingProgress.findMany({
        where: { userId },
        select: {
          status: true,
          inLibrary: true,
          currentPage: true,
          readingTimeSeconds: true,
        },
      }),
      prisma.readingHistory.findMany({
        where: { userId },
        orderBy: { lastReadAt: 'desc' },
        take: 3,
        select: {
          bookId: true,
          lastReadAt: true,
          lastPage: true,
          book: { select: { title: true, slug: true } },
        },
      }),
    ]);

    let completedCount = 0;
    let readingCount = 0;
    let wantToReadCount = 0;
    let totalPagesRead = 0;
    let totalReadingSeconds = 0;

    for (const row of progressRows) {
      totalPagesRead += Math.max(0, row.currentPage);
      totalReadingSeconds += Math.max(0, row.readingTimeSeconds);
      if (row.inLibrary) {
        if (row.status === ReadingStatus.COMPLETED) completedCount += 1;
        else if (row.status === ReadingStatus.READING) readingCount += 1;
        else if (row.status === ReadingStatus.WANT_TO_READ) wantToReadCount += 1;
      }
    }

    return {
      completedCount,
      readingCount,
      wantToReadCount,
      totalPagesRead,
      totalReadingSeconds,
      recentActivity: recentHistory.map((item) => ({
        bookId: item.bookId,
        title: item.book.title,
        slug: item.book.slug,
        lastPage: item.lastPage,
        lastReadAt: item.lastReadAt,
      })),
    };
  }
}
