import { Router } from 'express';
import { idParamSchema, SubscriptionController } from '../controllers/subscription.controller';
import { validate } from '../middlewares/validate';

const planRoutes = Router();
const controller = new SubscriptionController();

planRoutes.get('/', controller.listPlans);
planRoutes.get('/:id', validate({ params: idParamSchema }), controller.getPlanById);

export { planRoutes };
