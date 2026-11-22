import { Router } from 'express';
import { CatalogController, slugParamsSchema } from '../controllers/catalog.controller';
import { optionalAuth, requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const bookRoutes = Router();
const controller = new CatalogController();

bookRoutes.get('/', optionalAuth, controller.listBooks);
bookRoutes.get('/featured', optionalAuth, controller.getFeatured);
bookRoutes.get('/popular', optionalAuth, controller.getPopular);
bookRoutes.get('/recommended', optionalAuth, controller.getRecommended);
bookRoutes.get('/:slug', optionalAuth, validate({ params: slugParamsSchema }), controller.getBookBySlug);
bookRoutes.get(
  '/:slug/related',
  optionalAuth,
  validate({ params: slugParamsSchema }),
  controller.getRelatedBooks
);
bookRoutes.get(
  '/:slug/reader',
  optionalAuth,
  validate({ params: slugParamsSchema }),
  controller.getReaderPreview
);
bookRoutes.post(
  '/:slug/unlock',
  requireAuth,
  validate({ params: slugParamsSchema }),
  controller.unlockMonthlyBook
);

export { bookRoutes };
