import { BookAccessTier } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { BookAccessService } from '../services/bookAccess.service';
import { CatalogService } from '../services/catalog.service';
import { AppError } from '../utils/AppError';

export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  author: z.string().trim().optional(),
  year: z.coerce.number().int().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  accessLevel: z.nativeEnum(BookAccessTier).optional(),
  availability: z.enum(['all', 'free', 'included']).default('all'),
  sort: z.enum(['relevance', 'title', 'rating', 'recent']).default('relevance'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const slugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const bookIdParamsSchema = z.object({
  bookId: z.string().min(1),
});

export class CatalogController {
  constructor(
    private readonly catalogService = new CatalogService(),
    private readonly bookAccessService = new BookAccessService()
  ) {}

  listBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listBooksQuerySchema.parse(req.query);
      const result = await this.catalogService.listBooks(parsed, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.catalogService.getFeaturedBooks(req.user?.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getPopular = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.catalogService.getPopularBooks(req.user?.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getRecommended = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.catalogService.getRecommendedBooks(req.user?.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getBookBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const book = await this.catalogService.getBookBySlug(req.params.slug, req.user?.id);
      res.status(200).json({ book });
    } catch (error) {
      next(error);
    }
  };

  getRelatedBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.catalogService.getRelatedBooks(req.params.slug, req.user?.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getReaderPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.catalogService.getBookReaderPreview(req.params.slug, req.user?.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  unlockMonthlyBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const result = await this.bookAccessService.unlockMonthlyBook(req.user.id, req.params.slug);
      res.status(200).json({ status: 'ok', ...result });
    } catch (error) {
      next(error);
    }
  };

  listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.catalogService.listCategories();
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getCategoryBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listBooksQuerySchema.parse(req.query);
      const data = await this.catalogService.getCategoryBooks(
        req.params.slug,
        parsed,
        req.user?.id
      );
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  listAuthors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.catalogService.listAuthors();
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getAuthorBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const author = await this.catalogService.getAuthorBySlug(req.params.slug);
      res.status(200).json({ author });
    } catch (error) {
      next(error);
    }
  };

  getAuthorBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listBooksQuerySchema.parse(req.query);
      const data = await this.catalogService.getAuthorBooks(
        req.params.slug,
        parsed,
        req.user?.id
      );
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  listFavoriteIds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const bookIds = await this.catalogService.listFavoriteIds(req.user.id);
      res.status(200).json({ bookIds });
    } catch (error) {
      next(error);
    }
  };

  addFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.catalogService.addFavorite(req.user.id, req.params.bookId);
      res.status(200).json({ status: 'ok', isFavorite: true });
    } catch (error) {
      next(error);
    }
  };

  removeFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.catalogService.removeFavorite(req.user.id, req.params.bookId);
      res.status(200).json({ status: 'ok', isFavorite: false });
    } catch (error) {
      next(error);
    }
  };
}
