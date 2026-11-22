import { Router } from 'express';
import { bookIdParamSchema, LibraryController } from '../controllers/library.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const readingHistoryRoutes = Router();
const controller = new LibraryController();

readingHistoryRoutes.use(requireAuth);
readingHistoryRoutes.get('/', controller.getHistory);
readingHistoryRoutes.delete(
  '/:bookId',
  validate({ params: bookIdParamSchema }),
  controller.removeHistoryEntry
);

export { readingHistoryRoutes };
