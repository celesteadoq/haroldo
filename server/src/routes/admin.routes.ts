import { UserRole } from '@prisma/client';
import { Router } from 'express';
import {
  AdminController,
  adminIdParamSchema,
  createAuthorBodySchema,
  createBookBodySchema,
  createCategoryBodySchema,
  helpArticleBodySchema,
  savePreviewPagesBodySchema,
  updateAuthorBodySchema,
  updateBookBodySchema,
  updateCategoryBodySchema,
  updateHelpArticleBodySchema,
  updatePlanBodySchema,
  updateSubscriptionBodySchema,
  updateUserAccessBodySchema,
} from '../controllers/admin/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const adminRoutes = Router();
const controller = new AdminController();

adminRoutes.use(requireAuth, requireRole(UserRole.ADMIN));

adminRoutes.get('/access-check', controller.accessCheck);
adminRoutes.get('/dashboard', controller.getDashboard);

adminRoutes.get('/books', controller.listBooks);
adminRoutes.get('/books/:id', validate({ params: adminIdParamSchema }), controller.getBookById);
adminRoutes.post('/books', validate({ body: createBookBodySchema }), controller.createBook);
adminRoutes.patch(
  '/books/:id',
  validate({ params: adminIdParamSchema, body: updateBookBodySchema }),
  controller.updateBook
);
adminRoutes.delete('/books/:id', validate({ params: adminIdParamSchema }), controller.deleteBook);
adminRoutes.put(
  '/books/:id/preview',
  validate({ params: adminIdParamSchema, body: savePreviewPagesBodySchema }),
  controller.saveBookPreview
);

adminRoutes.get('/authors', controller.listAuthors);
adminRoutes.post('/authors', validate({ body: createAuthorBodySchema }), controller.createAuthor);
adminRoutes.patch(
  '/authors/:id',
  validate({ params: adminIdParamSchema, body: updateAuthorBodySchema }),
  controller.updateAuthor
);
adminRoutes.delete('/authors/:id', validate({ params: adminIdParamSchema }), controller.deleteAuthor);

adminRoutes.get('/categories', controller.listCategories);
adminRoutes.post(
  '/categories',
  validate({ body: createCategoryBodySchema }),
  controller.createCategory
);
adminRoutes.patch(
  '/categories/:id',
  validate({ params: adminIdParamSchema, body: updateCategoryBodySchema }),
  controller.updateCategory
);

adminRoutes.get('/users', controller.listUsers);
adminRoutes.get('/users/:id', validate({ params: adminIdParamSchema }), controller.getUserDetails);
adminRoutes.patch(
  '/users/:id',
  validate({ params: adminIdParamSchema, body: updateUserAccessBodySchema }),
  controller.updateUserAccess
);

adminRoutes.get('/plans', controller.listPlans);
adminRoutes.patch(
  '/plans/:id',
  validate({ params: adminIdParamSchema, body: updatePlanBodySchema }),
  controller.updatePlan
);

adminRoutes.get('/subscriptions', controller.listSubscriptions);
adminRoutes.patch(
  '/subscriptions/:id',
  validate({ params: adminIdParamSchema, body: updateSubscriptionBodySchema }),
  controller.updateSubscription
);

adminRoutes.get('/payments', controller.listPayments);

adminRoutes.get('/help', controller.listHelpArticles);
adminRoutes.post('/help', validate({ body: helpArticleBodySchema }), controller.createHelpArticle);
adminRoutes.patch(
  '/help/:id',
  validate({ params: adminIdParamSchema, body: updateHelpArticleBodySchema }),
  controller.updateHelpArticle
);
adminRoutes.delete('/help/:id', validate({ params: adminIdParamSchema }), controller.deleteHelpArticle);

adminRoutes.get('/audit-logs', controller.listAuditLogs);

export { adminRoutes };
