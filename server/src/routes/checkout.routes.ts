import { Router } from 'express';
import { checkoutBodySchema, SubscriptionController } from '../controllers/subscription.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const checkoutRoutes = Router();
const controller = new SubscriptionController();

checkoutRoutes.post(
  '/',
  requireAuth,
  validate({ body: checkoutBodySchema }),
  controller.simulateCheckout
);

export { checkoutRoutes };
