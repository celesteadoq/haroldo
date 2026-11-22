import { BookAccessTier, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { AdminAuditService } from './adminAudit.service';

export class AdminCatalogService {
  constructor(private readonly auditService = new AdminAuditService()) {}

  async listBooks(params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    authorId?: string;
    status?: 'active' | 'inactive' | 'all';
  }) {
    const safePage = Math.max(1, params.page);
    const safeLimit = Math.min(50, Math.max(1, params.limit));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.BookWhereInput = {
      ...(params.status === 'active'
        ? { isActive: true }
        : params.status === 'inactive'
          ? { isActive: false }
          : {}),
      ...(params.search
        ? {
            OR: [{ title: { contains: params.search } }, { slug: { contains: params.search } }],
          }
        : {}),
      ...(params.categoryId ? { categories: { some: { categoryId: params.categoryId } } } : {}),
      ...(params.authorId ? { authors: { some: { authorId: params.authorId } } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          authors: { include: { author: { select: { id: true, name: true, slug: true } } } },
          categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { previewPages: true } },
        },
      }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async getBookById(bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
        previewPages: { orderBy: { pageNumber: 'asc' } },
      },
    });
    if (!book) throw new AppError('Livro não encontrado.', 404);
    return book;
  }

  async createBook(
    adminUserId: string,
    data: {
      title: string;
      slug: string;
      subtitle?: string | null;
      description: string;
      coverUrl?: string | null;
      publicationYear?: number | null;
      publisher?: string | null;
      pageCount?: number | null;
      language: string;
      ageRating?: string | null;
      averageRating?: number;
      accessTier: BookAccessTier;
      isActive: boolean;
      isFeatured: boolean;
      isFreeEligible: boolean;
      hasFullContent: boolean;
      authorIds: string[];
      categoryIds: string[];
    }
  ) {
    const existingSlug = await prisma.book.findUnique({ where: { slug: data.slug } });
    if (existingSlug) throw new AppError('Já existe um livro com este slug.', 409);

    const created = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title: data.title,
          slug: data.slug,
          subtitle: data.subtitle ?? null,
          description: data.description,
          coverUrl: data.coverUrl || null,
          publicationYear: data.publicationYear ?? null,
          publisher: data.publisher ?? null,
          pageCount: data.pageCount ?? null,
          language: data.language,
          ageRating: data.ageRating ?? null,
          averageRating: data.averageRating ?? 0,
          ratingCount: 0,
          accessTier: data.accessTier,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          isFreeEligible: data.isFreeEligible,
          hasFullContent: data.hasFullContent,
        },
      });

      for (const authorId of Array.from(new Set(data.authorIds))) {
        await tx.bookAuthor.create({ data: { bookId: book.id, authorId } });
      }
      for (const categoryId of Array.from(new Set(data.categoryIds))) {
        await tx.bookCategory.create({ data: { bookId: book.id, categoryId } });
      }
      return book;
    });

    await this.auditService.record({
      adminUserId,
      action: 'BOOK_CREATE',
      entityType: 'Book',
      entityId: created.id,
      details: { title: created.title, slug: created.slug },
    });

    return this.getBookById(created.id);
  }

  async updateBook(
    adminUserId: string,
    bookId: string,
    data: {
      title?: string;
      slug?: string;
      subtitle?: string | null;
      description?: string;
      coverUrl?: string | null;
      publicationYear?: number | null;
      publisher?: string | null;
      pageCount?: number | null;
      language?: string;
      ageRating?: string | null;
      averageRating?: number;
      accessTier?: BookAccessTier;
      isActive?: boolean;
      isFeatured?: boolean;
      isFreeEligible?: boolean;
      hasFullContent?: boolean;
      authorIds?: string[];
      categoryIds?: string[];
    }
  ) {
    const existing = await prisma.book.findUnique({ where: { id: bookId } });
    if (!existing) throw new AppError('Livro não encontrado.', 404);

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.book.findUnique({ where: { slug: data.slug } });
      if (slugConflict) throw new AppError('Já existe outro livro com este slug.', 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: bookId },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl || null } : {}),
          ...(data.publicationYear !== undefined ? { publicationYear: data.publicationYear } : {}),
          ...(data.publisher !== undefined ? { publisher: data.publisher } : {}),
          ...(data.pageCount !== undefined ? { pageCount: data.pageCount } : {}),
          ...(data.language !== undefined ? { language: data.language } : {}),
          ...(data.ageRating !== undefined ? { ageRating: data.ageRating } : {}),
          ...(data.averageRating !== undefined ? { averageRating: data.averageRating } : {}),
          ...(data.accessTier !== undefined ? { accessTier: data.accessTier } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
          ...(data.isFreeEligible !== undefined ? { isFreeEligible: data.isFreeEligible } : {}),
          ...(data.hasFullContent !== undefined ? { hasFullContent: data.hasFullContent } : {}),
        },
      });

      if (data.authorIds) {
        await tx.bookAuthor.deleteMany({ where: { bookId } });
        for (const authorId of Array.from(new Set(data.authorIds))) {
          await tx.bookAuthor.create({ data: { bookId, authorId } });
        }
      }

      if (data.categoryIds) {
        await tx.bookCategory.deleteMany({ where: { bookId } });
        for (const categoryId of Array.from(new Set(data.categoryIds))) {
          await tx.bookCategory.create({ data: { bookId, categoryId } });
        }
      }
    });

    await this.auditService.record({
      adminUserId,
      action: 'BOOK_UPDATE',
      entityType: 'Book',
      entityId: bookId,
      details: { title: data.title ?? existing.title, isActive: data.isActive ?? existing.isActive },
    });

    return this.getBookById(bookId);
  }

  async deleteBook(adminUserId: string, bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        _count: {
          select: {
            readingProgress: true,
            readingHistory: true,
            favorites: true,
            monthlyBookUnlocks: true,
            offlineBooks: true,
          },
        },
      },
    });
    if (!book) throw new AppError('Livro não encontrado.', 404);

    const hasDependencies =
      book._count.readingProgress > 0 ||
      book._count.readingHistory > 0 ||
      book._count.favorites > 0 ||
      book._count.monthlyBookUnlocks > 0 ||
      book._count.offlineBooks > 0;

    if (hasDependencies) {
      throw new AppError(
        'Este livro possui leituras, favoritos ou desbloqueios vinculados. Desative o livro em vez de excluí-lo.',
        409,
        { code: 'BOOK_HAS_DEPENDENCIES' }
      );
    }

    await prisma.book.delete({ where: { id: bookId } });

    await this.auditService.record({
      adminUserId,
      action: 'BOOK_DELETE',
      entityType: 'Book',
      entityId: bookId,
      details: { title: book.title },
    });
  }

  async saveBookPreviewPages(
    adminUserId: string,
    bookId: string,
    pages: Array<{
      pageNumber: number;
      chapterTitle?: string | null;
      eyebrow: string;
      title: string;
      content: string;
      disclaimer?: string | null;
    }>
  ) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new AppError('Livro não encontrado.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.bookPreviewPage.deleteMany({ where: { bookId } });
      for (const [idx, page] of pages.entries()) {
        await tx.bookPreviewPage.create({
          data: {
            bookId,
            pageNumber: idx + 1,
            chapterTitle: page.chapterTitle ?? null,
            eyebrow: page.eyebrow,
            title: page.title,
            content: page.content,
            disclaimer: page.disclaimer ?? null,
          },
        });
      }
    });

    await this.auditService.record({
      adminUserId,
      action: 'BOOK_PREVIEW_UPDATE',
      entityType: 'Book',
      entityId: bookId,
      details: { pageCount: pages.length },
    });

    return this.getBookById(bookId);
  }

  async listAuthors(search?: string) {
    return prisma.author.findMany({
      where: search ? { name: { contains: search } } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { books: true } },
        books: { include: { book: { select: { id: true, title: true, slug: true } } } },
      },
    });
  }

  async createAuthor(
    adminUserId: string,
    data: { name: string; slug: string; biography?: string | null; photoUrl?: string | null }
  ) {
    const conflict = await prisma.author.findFirst({
      where: { OR: [{ name: data.name }, { slug: data.slug }] },
    });
    if (conflict) {
      throw new AppError('Já existe autor cadastrado com este nome ou slug.', 409);
    }

    const author = await prisma.author.create({
      data: {
        name: data.name,
        slug: data.slug,
        biography: data.biography ?? null,
        photoUrl: data.photoUrl || null,
      },
    });
    await this.auditService.record({
      adminUserId,
      action: 'AUTHOR_CREATE',
      entityType: 'Author',
      entityId: author.id,
      details: { name: author.name },
    });
    return author;
  }

  async updateAuthor(
    adminUserId: string,
    authorId: string,
    data: { name?: string; slug?: string; biography?: string | null; photoUrl?: string | null }
  ) {
    const existing = await prisma.author.findUnique({ where: { id: authorId } });
    if (!existing) throw new AppError('Autor não encontrado.', 404);

    if (data.name || data.slug) {
      const conflict = await prisma.author.findFirst({
        where: {
          id: { not: authorId },
          OR: [
            ...(data.name ? [{ name: data.name }] : []),
            ...(data.slug ? [{ slug: data.slug }] : []),
          ],
        },
      });
      if (conflict) throw new AppError('Já existe outro autor com este nome ou slug.', 409);
    }

    const author = await prisma.author.update({
      where: { id: authorId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.biography !== undefined ? { biography: data.biography } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl || null } : {}),
      },
    });
    await this.auditService.record({
      adminUserId,
      action: 'AUTHOR_UPDATE',
      entityType: 'Author',
      entityId: author.id,
      details: { name: author.name },
    });
    return author;
  }

  async deleteAuthor(adminUserId: string, authorId: string) {
    const existing = await prisma.author.findUnique({ where: { id: authorId } });
    if (!existing) throw new AppError('Autor não encontrado.', 404);

    const linked = await prisma.bookAuthor.count({ where: { authorId } });
    if (linked > 0) {
      throw new AppError('Não é possível excluir autor associado a livros.', 409);
    }

    await prisma.author.delete({ where: { id: authorId } });
    await this.auditService.record({
      adminUserId,
      action: 'AUTHOR_DELETE',
      entityType: 'Author',
      entityId: authorId,
      details: { name: existing.name },
    });
  }

  async listCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    });
  }

  async createCategory(
    adminUserId: string,
    data: { name: string; slug: string; description: string; isActive?: boolean }
  ) {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug: data.slug }] },
    });
    if (existing) throw new AppError('Já existe categoria com este nome ou slug.', 409);

    const cat = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
    await this.auditService.record({
      adminUserId,
      action: 'CATEGORY_CREATE',
      entityType: 'Category',
      entityId: cat.id,
      details: { name: cat.name },
    });
    return cat;
  }

  async updateCategory(
    adminUserId: string,
    categoryId: string,
    data: { name?: string; slug?: string; description?: string; isActive?: boolean }
  ) {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) throw new AppError('Categoria não encontrada.', 404);

    if (data.name || data.slug) {
      const conflict = await prisma.category.findFirst({
        where: {
          id: { not: categoryId },
          OR: [
            ...(data.name ? [{ name: data.name }] : []),
            ...(data.slug ? [{ slug: data.slug }] : []),
          ],
        },
      });
      if (conflict) throw new AppError('Já existe outra categoria com este nome ou slug.', 409);
    }

    const cat = await prisma.category.update({
      where: { id: categoryId },
      data,
    });
    await this.auditService.record({
      adminUserId,
      action: 'CATEGORY_UPDATE',
      entityType: 'Category',
      entityId: cat.id,
      details: { name: cat.name, isActive: cat.isActive },
    });
    return cat;
  }
}
