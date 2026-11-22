import { Router } from 'express';
import {
  addLibraryBodySchema,
  bookIdParamSchema,
  LibraryController,
  updateLibraryBodySchema,
} from '../controllers/library.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const libraryRoutes = Router();
const controller = new LibraryController();

libraryRoutes.use(requireAuth);
libraryRoutes.get('/', controller.getLibrary);
libraryRoutes.post(
  '/:bookId',
  validate({ params: bookIdParamSchema, body: addLibraryBodySchema }),
  controller.addToLibrary
);
libraryRoutes.patch(
  '/:bookId',
  validate({ params: bookIdParamSchema, body: updateLibraryBodySchema }),
  controller.updateLibraryStatus
);
libraryRoutes.delete('/:bookId', validate({ params: bookIdParamSchema }), controller.removeFromLibrary);

export { libraryRoutes };
