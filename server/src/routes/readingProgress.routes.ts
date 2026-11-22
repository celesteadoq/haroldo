import { Router } from 'express';
import {
  bookIdParamSchema,
  LibraryController,
  saveProgressBodySchema,
} from '../controllers/library.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const readingProgressRoutes = Router();
const controller = new LibraryController();

readingProgressRoutes.use(requireAuth);
readingProgressRoutes.get('/', controller.listAllProgress);
readingProgressRoutes.get('/:bookId', validate({ params: bookIdParamSchema }), controller.getBookProgress);
readingProgressRoutes.put(
  '/:bookId',
  validate({ params: bookIdParamSchema, body: saveProgressBodySchema }),
  controller.saveBookProgress
);

export { readingProgressRoutes };
