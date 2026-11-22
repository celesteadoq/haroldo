import { Router } from 'express';
import { CatalogController, slugParamsSchema } from '../controllers/catalog.controller';
import { optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const categoryRoutes = Router();
const controller = new CatalogController();

categoryRoutes.get('/', controller.listCategories);
categoryRoutes.get(
  '/:slug/books',
  optionalAuth,
  validate({ params: slugParamsSchema }),
  controller.getCategoryBooks
);

export { categoryRoutes };
