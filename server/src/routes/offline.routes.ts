import { Router } from 'express';
import { offlineBookParamSchema, OfflineController } from '../controllers/offline.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const offlineRoutes = Router();
const controller = new OfflineController();

offlineRoutes.use(requireAuth);
offlineRoutes.get('/books', controller.list);
offlineRoutes.post('/books/:bookId', validate({ params: offlineBookParamSchema }), controller.add);
offlineRoutes.delete(
  '/books/:bookId',
  validate({ params: offlineBookParamSchema }),
  controller.remove
);

export { offlineRoutes };
