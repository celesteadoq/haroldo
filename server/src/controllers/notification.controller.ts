import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../utils/AppError';

export const notificationQuerySchema = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});

export class NotificationController {
  constructor(private readonly notificationService = new NotificationService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const { unreadOnly } = notificationQuerySchema.parse(req.query);
      const data = await this.notificationService.listForUser(req.user.id, unreadOnly);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const item = await this.notificationService.markAsRead(req.user.id, req.params.id);
      res.status(200).json({ status: 'ok', item });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.notificationService.markAllAsRead(req.user.id);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}
