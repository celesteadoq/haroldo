import { Router } from 'express';
import {
  changePlanBodySchema,
  checkoutBodySchema,
  SubscriptionController,
} from '../controllers/subscription.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const subscriptionRoutes = Router();
const controller = new SubscriptionController();

subscriptionRoutes.use(requireAuth);
subscriptionRoutes.get('/current', controller.getCurrentSubscription);
subscriptionRoutes.post('/trial', controller.startTrial);
subscriptionRoutes.post('/', validate({ body: checkoutBodySchema }), controller.simulateCheckout);
subscriptionRoutes.patch(
  '/change-plan',
  validate({ body: changePlanBodySchema }),
  controller.changePlan
);
subscriptionRoutes.post('/cancel', controller.cancelSubscription);

export { subscriptionRoutes };
