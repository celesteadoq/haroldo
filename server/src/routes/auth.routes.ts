import { Router } from 'express';
import {
  AuthController,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../controllers/auth.controller';
import { optionalAuth, requireAuth } from '../middlewares/auth';
import { authActionRateLimiter, loginRateLimiter } from '../middlewares/rateLimit';
import { validate } from '../middlewares/validate';

const authRoutes = Router();
const controller = new AuthController();

authRoutes.post(
  '/register',
  authActionRateLimiter,
  validate({ body: registerSchema }),
  controller.register
);
authRoutes.post('/login', loginRateLimiter, validate({ body: loginSchema }), controller.login);
authRoutes.post('/refresh', controller.refresh);
authRoutes.post('/logout', optionalAuth, controller.logout);
authRoutes.get('/me', requireAuth, controller.me);
authRoutes.post(
  '/forgot-password',
  authActionRateLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword
);
authRoutes.post(
  '/reset-password',
  authActionRateLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPassword
);

export { authRoutes };
