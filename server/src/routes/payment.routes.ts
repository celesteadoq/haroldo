import { Router } from 'express';
import {
  checkoutBodySchema,
  idParamSchema,
  SubscriptionController,
} from '../controllers/subscription.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const paymentRoutes = Router();
const controller = new SubscriptionController();

paymentRoutes.use(requireAuth);
paymentRoutes.post('/simulate', validate({ body: checkoutBodySchema }), controller.simulateCheckout);
paymentRoutes.get('/', controller.listPayments);
paymentRoutes.get('/:id', validate({ params: idParamSchema }), controller.getPaymentById);

export { paymentRoutes };
