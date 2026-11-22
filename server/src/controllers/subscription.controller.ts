import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.service';
import { AppError } from '../utils/AppError';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const changePlanBodySchema = z.object({
  targetPlanId: z.string().min(1),
});

export const checkoutBodySchema = z.object({
  planId: z.string().min(1),
  cardHolderName: z.string().trim().min(3, 'Informe o nome impresso no cartão.'),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length >= 13 && v.length <= 19, 'Número de cartão inválido.'),
  expiryMonth: z.coerce.number().int().min(1).max(12),
  expiryYear: z.coerce.number().int().min(2024).max(2099),
  cvv: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, 'CVV inválido.'),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'Confirme os termos da assinatura.' }),
  }),
  idempotencyKey: z.string().min(8).max(100).optional(),
});

export class SubscriptionController {
  constructor(private readonly subscriptionService = new SubscriptionService()) {}

  listPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.subscriptionService.listPlans();
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getPlanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await this.subscriptionService.getPlanById(req.params.id);
      res.status(200).json({ plan });
    } catch (error) {
      next(error);
    }
  };

  getCurrentSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const data = await this.subscriptionService.getCurrentDetails(req.user.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  startTrial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const subscription = await this.subscriptionService.startPremiumTrial(req.user.id);
      res.status(201).json({ status: 'ok', subscription });
    } catch (error) {
      next(error);
    }
  };

  simulateCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const headerIdempotency = req.headers['idempotency-key'];
      const idempotencyKey =
        req.body.idempotencyKey ||
        (typeof headerIdempotency === 'string' ? headerIdempotency : undefined);

      const result = await this.subscriptionService.simulateCheckoutAndActivate({
        userId: req.user.id,
        planId: req.body.planId,
        cardNumber: req.body.cardNumber,
        cardHolderName: req.body.cardHolderName,
        expiryMonth: req.body.expiryMonth,
        expiryYear: req.body.expiryYear,
        cvv: req.body.cvv,
        idempotencyKey,
      });

      res.status(200).json({ status: 'ok', ...result });
    } catch (error) {
      next(error);
    }
  };

  changePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const result = await this.subscriptionService.requestPlanChange(
        req.user.id,
        req.body.targetPlanId
      );
      res.status(200).json({ status: 'ok', ...result });
    } catch (error) {
      next(error);
    }
  };

  cancelSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const subscription = await this.subscriptionService.cancelSubscription(req.user.id);
      res.status(200).json({ status: 'ok', subscription });
    } catch (error) {
      next(error);
    }
  };

  listPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const items = await this.subscriptionService.listPayments(req.user.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const payment = await this.subscriptionService.getPaymentById(req.user.id, req.params.id);
      res.status(200).json({ payment });
    } catch (error) {
      next(error);
    }
  };
}
