import { Router } from 'express';
import {
  AccountController,
  changePasswordSchema,
  deviceParamsSchema,
  updateProfileSchema,
} from '../controllers/account.controller';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const accountRoutes = Router();
const controller = new AccountController();

accountRoutes.use(requireAuth);
accountRoutes.get('/profile', controller.getProfile);
accountRoutes.patch('/profile', validate({ body: updateProfileSchema }), controller.updateProfile);
accountRoutes.patch('/password', validate({ body: changePasswordSchema }), controller.changePassword);
accountRoutes.get('/devices', controller.listDevices);
accountRoutes.delete(
  '/devices/:id',
  validate({ params: deviceParamsSchema }),
  controller.disconnectDevice
);

export { accountRoutes };
