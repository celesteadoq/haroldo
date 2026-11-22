import { Router } from 'express';
import { CatalogController, slugParamsSchema } from '../controllers/catalog.controller';
import { optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const authorRoutes = Router();
const controller = new CatalogController();

authorRoutes.get('/', controller.listAuthors);
authorRoutes.get('/:slug', validate({ params: slugParamsSchema }), controller.getAuthorBySlug);
authorRoutes.get(
  '/:slug/books',
  optionalAuth,
  validate({ params: slugParamsSchema }),
  controller.getAuthorBooks
);

export { authorRoutes };
