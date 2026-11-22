import { BookAccessTier, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { BookAccessService, type UserPlanContext } from './bookAccess.service';
import { resolveCoverUrl } from '../utils/cover';

export interface ListBooksQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  author?: string;
  year?: number;
  minRating?: number;
  accessLevel?: BookAccessTier;
  availability?: 'all' | 'free' | 'included';
  sort: 'relevance' | 'title' | 'rating' | 'recent';
  order: 'asc' | 'desc';
}

const bookInclude = {
  authors: {
    include: {
      author: {
        select: { id: true, name: true, slug: true, biography: true, photoUrl: true },
      },
    },
  },
  categories: {
    include: {
      category: {
        select: { id: true, name: true, slug: true, description: true },
      },
    },
  },
} satisfies Prisma.BookInclude;

type BookWithRelations = Prisma.BookGetPayload<{ include: typeof bookInclude }>;

export class CatalogService {
  constructor(private readonly bookAccessService = new BookAccessService()) {}

  private async getFavoriteBookIds(userId?: string): Promise<Set<string>> {
    if (!userId) return new Set();
    const favs = await prisma.favorite.findMany({
      where: { userId },
      select: { bookId: true },
    });
    return new Set(favs.map((f) => f.bookId));
  }

  private mapBook(
    book: BookWithRelations,
    userContext: UserPlanContext,
    favoriteIds: Set<string>
  ) {
    const access = this.bookAccessService.evaluateBookAccess(book, userContext);
    return {
      id: book.id,
      title: book.title,
      slug: book.slug,
      subtitle: book.subtitle ?? null,
      description: book.description,
      synopsis: book.description,
      coverImage: resolveCoverUrl(book.coverUrl, book.slug),
      bannerImage: book.bannerUrl ?? null,
      publicationYear: book.publicationYear ?? null,
      language: book.language,
      publisher: book.publisher ?? null,
      pageCount: book.pageCount ?? null,
      isbn: book.isbn ?? null,
      ageRating: book.ageRating ?? null,
      rating: book.averageRating > 0 ? book.averageRating : null,
      ratingCount: book.ratingCount,
      isFeatured: book.isFeatured,
      isPublished: book.isActive,
      isFreeEligible: book.isFreeEligible,
      hasFullContent: book.hasFullContent,
      accessLevel: book.accessTier,
      access,
      isFavorite: favoriteIds.has(book.id),
      authors: book.authors.map((ba) => ba.author),
      categories: book.categories.map((bc) => bc.category),
    };
  }

  private buildOrderBy(
    sort: ListBooksQuery['sort'],
    order: ListBooksQuery['order']
  ): Prisma.BookOrderByWithRelationInput[] {
    switch (sort) {
      case 'title':
        return [{ title: order }];
      case 'rating':
        return [{ averageRating: order }, { title: 'asc' }];
      case 'recent':
        return [{ publicationYear: order }, { createdAt: order }];
      case 'relevance':
      default:
        return [{ isFeatured: 'desc' }, { averageRating: 'desc' }, { title: 'asc' }];
    }
  }

  async listBooks(query: ListBooksQuery, userId?: string) {
    const safePage = Math.max(1, query.page);
    const safeLimit = Math.min(50, Math.max(1, query.limit));
    const skip = (safePage - 1) * safeLimit;

    const [userContext, favoriteIds] = await Promise.all([
      this.bookAccessService.getUserPlanContext(userId),
      this.getFavoriteBookIds(userId),
    ]);

    const andConditions: Prisma.BookWhereInput[] = [{ isActive: true }];

    if (query.search) {
      const term = query.search.trim();
      if (term.length > 0) {
        andConditions.push({
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
            { authors: { some: { author: { name: { contains: term } } } } },
            { categories: { some: { category: { name: { contains: term } } } } },
          ],
        });
      }
    }

    if (query.category) {
      andConditions.push({
        categories: { some: { category: { slug: query.category, isActive: true } } },
      });
    }

    if (query.author) {
      andConditions.push({
        authors: { some: { author: { slug: query.author } } },
      });
    }

    if (typeof query.year === 'number') {
      andConditions.push({ publicationYear: query.year });
    }

    if (typeof query.minRating === 'number') {
      andConditions.push({ averageRating: { gte: query.minRating } });
    }

    if (query.accessLevel) {
      andConditions.push({ accessTier: query.accessLevel });
    }

    if (query.availability === 'free') {
      andConditions.push({ isFreeEligible: true });
    } else if (query.availability === 'included') {
      if (userContext.planName === 'Básico') {
        andConditions.push({ accessTier: { in: [BookAccessTier.FREE, BookAccessTier.BASIC] } });
      } else if (userContext.planName === 'Gratuito' || !userContext.planName) {
        andConditions.push({ isFreeEligible: true });
      }
    }

    const where: Prisma.BookWhereInput = { AND: andConditions };

    const [total, rows] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: bookInclude,
        orderBy: this.buildOrderBy(query.sort, query.order),
        skip,
        take: safeLimit,
      }),
    ]);

    return {
      items: rows.map((book) => this.mapBook(book, userContext, favoriteIds)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async getBookBySlug(slug: string, userId?: string) {
    const [book, userContext, favoriteIds] = await Promise.all([
      prisma.book.findFirst({
        where: { slug, isActive: true },
        include: bookInclude,
      }),
      this.bookAccessService.getUserPlanContext(userId),
      this.getFavoriteBookIds(userId),
    ]);

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    return this.mapBook(book, userContext, favoriteIds);
  }

  async getFeaturedBooks(userId?: string) {
    const [books, userContext, favoriteIds] = await Promise.all([
      prisma.book.findMany({
        where: { isActive: true, isFeatured: true },
        include: bookInclude,
        orderBy: [{ averageRating: 'desc' }, { title: 'asc' }],
        take: 6,
      }),
      this.bookAccessService.getUserPlanContext(userId),
      this.getFavoriteBookIds(userId),
    ]);

    return books.map((book) => this.mapBook(book, userContext, favoriteIds));
  }

  async getPopularBooks(userId?: string) {
    const [books, userContext, favoriteIds] = await Promise.all([
      prisma.book.findMany({
        where: { isActive: true },
        include: bookInclude,
        orderBy: [{ averageRating: 'desc' }, { isFeatured: 'desc' }, { title: 'asc' }],
        take: 6,
      }),
      this.bookAccessService.getUserPlanContext(userId),
      this.getFavoriteBookIds(userId),
    ]);

    return books.map((book) => this.mapBook(book, userContext, favoriteIds));
  }

  async getRecommendedBooks(userId?: string) {
    const [books, userContext, favoriteIds] = await Promise.all([
      prisma.book.findMany({
        where: { isActive: true },
        include: bookInclude,
        orderBy: [{ publicationYear: 'desc' }, { averageRating: 'desc' }],
        take: 6,
      }),
      this.bookAccessService.getUserPlanContext(userId),
      this.getFavoriteBookIds(userId),
    ]);

    return books.map((book) => this.mapBook(book, userContext, favoriteIds));
  }

  async getRelatedBooks(slug: string, userId?: string) {
    const target = await prisma.book.findFirst({
      where: { slug, isActive: true },
      include: { categories: true, authors: true },
    });

    if (!target) {
      throw new AppError('Livro não encontrado.', 404);
    }

    const categoryIds = target.categories.map((c) => c.categoryId);
    const authorIds = target.authors.map((a) => a.authorId);

    const [related, userContext, favoriteIds] = await Promise.all([
      prisma.book.findMany({
        where: {
          isActive: true,
          id: { not: target.id },
          OR: [
            { categories: { some: { categoryId: { in: categoryIds } } } },
            { authors: { some: { authorId: { in: authorIds } } } },
          ],
        },
        include: bookInclude,
        orderBy: [{ averageRating: 'desc' }, { title: 'asc' }],
        take: 4,
      }),
      this.bookAccessService.getUserPlanContext(userId),
      this.getFavoriteBookIds(userId),
    ]);

    return related.map((book) => this.mapBook(book, userContext, favoriteIds));
  }

  async getBookReaderPreview(slug: string, userId?: string) {
    const [book, userContext] = await Promise.all([
      prisma.book.findFirst({
        where: { slug, isActive: true },
        include: {
          authors: { include: { author: { select: { name: true, slug: true } } } },
          previewPages: { orderBy: { pageNumber: 'asc' } },
        },
      }),
      this.bookAccessService.getUserPlanContext(userId),
    ]);

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    const access = this.bookAccessService.evaluateBookAccess(book, userContext);

    if (!access.canReadPreview && !access.canReadFull) {
      throw new AppError(
        `Este título requer o plano ${access.requiredPlanName}.`,
        403,
        {
          code: 'BOOK_ACCESS_RESTRICTED',
          requiredPlan: access.requiredPlanName,
          reason: access.reason,
        }
      );
    }

    const allowedPages = access.canReadFull ? book.previewPages : book.previewPages.slice(0, 2);

    const savedProgress = userId
      ? await prisma.readingProgress.findUnique({
          where: { userId_bookId: { userId, bookId: book.id } },
        })
      : null;

    return {
      book: {
        id: book.id,
        title: book.title,
        slug: book.slug,
        coverImage: resolveCoverUrl(book.coverUrl, book.slug),
        hasFullContent: book.hasFullContent,
        authors: book.authors.map((a) => a.author),
      },
      access,
      savedProgress,
      hasEditorialPreview: allowedPages.length > 0,
      previewPages: allowedPages.map((p) => ({
        pageNumber: p.pageNumber,
        chapterTitle: p.chapterTitle,
        eyebrow: p.eyebrow,
        title: p.title,
        content: p.content,
        disclaimer: p.disclaimer,
      })),
    };
  }

  async listCategories() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            books: { where: { book: { isActive: true } } },
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      bookCount: cat._count.books,
    }));
  }

  async getCategoryBooks(slug: string, query: Omit<ListBooksQuery, 'category'>, userId?: string) {
    const category = await prisma.category.findFirst({ where: { slug, isActive: true } });
    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const books = await this.listBooks({ ...query, category: slug }, userId);
    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      ...books,
    };
  }

  async listAuthors() {
    const authors = await prisma.author.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            books: { where: { book: { isActive: true } } },
          },
        },
      },
    });

    return authors.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      biography: a.biography ?? null,
      photoUrl: a.photoUrl ?? null,
      bookCount: a._count.books,
    }));
  }

  async getAuthorBySlug(slug: string) {
    const author = await prisma.author.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            books: { where: { book: { isActive: true } } },
          },
        },
      },
    });

    if (!author) {
      throw new AppError('Autor não encontrado.', 404);
    }

    return {
      id: author.id,
      name: author.name,
      slug: author.slug,
      biography: author.biography ?? null,
      photoUrl: author.photoUrl ?? null,
      bookCount: author._count.books,
    };
  }

  async getAuthorBooks(slug: string, query: Omit<ListBooksQuery, 'author'>, userId?: string) {
    const author = await this.getAuthorBySlug(slug);
    const books = await this.listBooks({ ...query, author: slug }, userId);
    return { author, ...books };
  }

  async listFavoriteIds(userId: string) {
    const favs = await prisma.favorite.findMany({
      where: { userId },
      select: { bookId: true },
    });
    return favs.map((f) => f.bookId);
  }

  async addFavorite(userId: string, bookId: string) {
    const book = await prisma.book.findFirst({ where: { id: bookId, isActive: true } });
    if (!book) throw new AppError('Livro não encontrado.', 404);

    await prisma.favorite.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {},
      create: { userId, bookId },
    });
  }

  async removeFavorite(userId: string, bookId: string) {
    await prisma.favorite.deleteMany({
      where: { userId, bookId },
    });
  }
}
