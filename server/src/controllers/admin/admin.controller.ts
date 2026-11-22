import { BookAccessTier, PaymentStatus, SubscriptionStatus, UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AdminAuditService } from '../../services/admin/adminAudit.service';
import { AdminCatalogService } from '../../services/admin/adminCatalog.service';
import { AdminCommercialService } from '../../services/admin/adminCommercial.service';
import { AdminDashboardService } from '../../services/admin/adminDashboard.service';
import { HelpService } from '../../services/help.service';
import { AppError } from '../../utils/AppError';

export const adminIdParamSchema = z.object({ id: z.string().min(1) });

export const dashboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

export const adminBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  authorId: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
});

export const createBookBodySchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  subtitle: z.string().trim().nullable().optional(),
  description: z.string().trim().min(1),
  coverUrl: z.string().trim().nullable().optional(),
  publicationYear: z.coerce.number().int().nullable().optional(),
  publisher: z.string().trim().nullable().optional(),
  pageCount: z.coerce.number().int().positive().nullable().optional(),
  language: z.string().trim().default('Inglês'),
  ageRating: z.string().trim().nullable().optional(),
  averageRating: z.coerce.number().min(0).max(5).optional().default(0),
  accessTier: z.nativeEnum(BookAccessTier).default(BookAccessTier.BASIC),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isFreeEligible: z.boolean().default(false),
  hasFullContent: z.boolean().default(false),
  authorIds: z.array(z.string().min(1)).min(1),
  categoryIds: z.array(z.string().min(1)).min(1),
});

export const updateBookBodySchema = createBookBodySchema.partial();

export const savePreviewPagesBodySchema = z.object({
  pages: z.array(
    z.object({
      pageNumber: z.coerce.number().int().positive(),
      chapterTitle: z.string().trim().nullable().optional(),
      eyebrow: z.string().trim().min(1).default('BIBLIOFLIX / CADERNO DE LEITURA'),
      title: z.string().trim().min(1),
      content: z.string().trim().min(1),
      disclaimer: z.string().trim().nullable().optional(),
    })
  ),
});

export const createAuthorBodySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  biography: z.string().trim().nullable().optional(),
  photoUrl: z.string().trim().nullable().optional(),
});

export const updateAuthorBodySchema = createAuthorBodySchema.partial();

export const createCategoryBodySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().min(2),
  isActive: z.boolean().optional().default(true),
});

export const updateCategoryBodySchema = createCategoryBodySchema.partial();

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  search: z.string().trim().optional(),
  planId: z.string().trim().optional(),
  status: z.enum(['active', 'blocked', 'all']).default('all'),
});

export const updateUserAccessBodySchema = z
  .object({
    isBlocked: z.boolean().optional(),
    role: z.nativeEnum(UserRole).optional(),
  })
  .refine((d) => d.isBlocked !== undefined || d.role !== undefined, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export const updatePlanBodySchema = z.object({
  description: z.string().trim().min(2).optional(),
  maxDevices: z.coerce.number().int().min(1).max(10).optional(),
  offlineBookLimit: z.coerce.number().int().min(0).max(50).optional(),
  monthlyBookLimit: z.coerce.number().int().min(0).nullable().optional(),
  hasAds: z.boolean().optional(),
  hasOfflineReading: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const adminSubscriptionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  search: z.string().trim().optional(),
  planId: z.string().trim().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
});

export const updateSubscriptionBodySchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export const adminPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  search: z.string().trim().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  period: z.enum(['7d', '30d', '90d', 'all']).default('all'),
});

export const helpArticleBodySchema = z.object({
  category: z.string().trim().min(2),
  question: z.string().trim().min(3),
  answer: z.string().trim().min(3),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateHelpArticleBodySchema = helpArticleBodySchema.partial();

export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  action: z.string().trim().optional(),
});

export class AdminController {
  constructor(
    private readonly dashboardService = new AdminDashboardService(),
    private readonly catalogService = new AdminCatalogService(),
    private readonly commercialService = new AdminCommercialService(),
    private readonly helpService = new HelpService(),
    private readonly auditService = new AdminAuditService()
  ) {}

  private requireAdminId(req: Request): string {
    if (!req.user) throw new AppError('Autenticação necessária.', 401);
    return req.user.id;
  }

  accessCheck = (req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', role: req.user?.role });
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period } = dashboardQuerySchema.parse(req.query);
      const data = await this.dashboardService.getOverview(period);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  listBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = adminBooksQuerySchema.parse(req.query);
      const data = await this.catalogService.listBooks(query);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  getBookById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const book = await this.catalogService.getBookById(req.params.id);
      res.status(200).json({ book });
    } catch (error) {
      next(error);
    }
  };

  createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const book = await this.catalogService.createBook(adminId, req.body);
      res.status(201).json({ status: 'ok', book });
    } catch (error) {
      next(error);
    }
  };

  updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const book = await this.catalogService.updateBook(adminId, req.params.id, req.body);
      res.status(200).json({ status: 'ok', book });
    } catch (error) {
      next(error);
    }
  };

  deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      await this.catalogService.deleteBook(adminId, req.params.id);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  saveBookPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const book = await this.catalogService.saveBookPreviewPages(
        adminId,
        req.params.id,
        req.body.pages
      );
      res.status(200).json({ status: 'ok', book });
    } catch (error) {
      next(error);
    }
  };

  listAuthors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const items = await this.catalogService.listAuthors(search);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  createAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const author = await this.catalogService.createAuthor(adminId, req.body);
      res.status(201).json({ status: 'ok', author });
    } catch (error) {
      next(error);
    }
  };

  updateAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const author = await this.catalogService.updateAuthor(adminId, req.params.id, req.body);
      res.status(200).json({ status: 'ok', author });
    } catch (error) {
      next(error);
    }
  };

  deleteAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      await this.catalogService.deleteAuthor(adminId, req.params.id);
      res.status(200).json({ status: 'ok' });
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

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const category = await this.catalogService.createCategory(adminId, req.body);
      res.status(201).json({ status: 'ok', category });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const category = await this.catalogService.updateCategory(adminId, req.params.id, req.body);
      res.status(200).json({ status: 'ok', category });
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = adminUsersQuerySchema.parse(req.query);
      const data = await this.commercialService.listUsers(query);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.commercialService.getUserDetails(req.params.id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  updateUserAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const user = await this.commercialService.updateUserAccess(adminId, req.params.id, req.body);
      res.status(200).json({ status: 'ok', user });
    } catch (error) {
      next(error);
    }
  };

  listPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.commercialService.listPlans();
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const plan = await this.commercialService.updatePlan(adminId, req.params.id, req.body);
      res.status(200).json({ status: 'ok', plan });
    } catch (error) {
      next(error);
    }
  };

  listSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = adminSubscriptionsQuerySchema.parse(req.query);
      const data = await this.commercialService.listSubscriptions(query);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  updateSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const subscription = await this.commercialService.adminUpdateSubscription(
        adminId,
        req.params.id,
        req.body
      );
      res.status(200).json({ status: 'ok', subscription });
    } catch (error) {
      next(error);
    }
  };

  listPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = adminPaymentsQuerySchema.parse(req.query);
      const data = await this.commercialService.listPayments(query);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  listHelpArticles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.helpService.listAdminArticles();
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  createHelpArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const article = await this.helpService.createArticle(adminId, req.body);
      res.status(201).json({ status: 'ok', article });
    } catch (error) {
      next(error);
    }
  };

  updateHelpArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      const article = await this.helpService.updateArticle(adminId, req.params.id, req.body);
      res.status(200).json({ status: 'ok', article });
    } catch (error) {
      next(error);
    }
  };

  deleteHelpArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.requireAdminId(req);
      await this.helpService.deleteArticle(adminId, req.params.id);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = auditLogsQuerySchema.parse(req.query);
      const data = await this.auditService.list(query);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
