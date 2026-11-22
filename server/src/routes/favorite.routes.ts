import { Router } from 'express';
import { bookIdParamsSchema, CatalogController } from '../controllers/catalog.controller';
import { LibraryController } from '../controllers/library.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const favoriteRoutes = Router();
const catalogController = new CatalogController();
const libraryController = new LibraryController();

favoriteRoutes.use(requireAuth);
favoriteRoutes.get('/', libraryController.listFavorites);
favoriteRoutes.get('/ids', catalogController.listFavoriteIds);
favoriteRoutes.post('/:bookId', validate({ params: bookIdParamsSchema }), catalogController.addFavorite);
favoriteRoutes.delete(
  '/:bookId',
  validate({ params: bookIdParamsSchema }),
  catalogController.removeFavorite
);

export { favoriteRoutes };
