import { Router } from 'express';
import {
  NotificationController,
  notificationIdParamSchema,
} from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const notificationRoutes = Router();
const controller = new NotificationController();

notificationRoutes.use(requireAuth);
notificationRoutes.get('/', controller.list);
notificationRoutes.patch('/read-all', controller.markAllAsRead);
notificationRoutes.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  controller.markAsRead
);

export { notificationRoutes };
