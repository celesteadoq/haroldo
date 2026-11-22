import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { OfflineService } from '../services/offline.service';
import { AppError } from '../utils/AppError';

export const offlineBookParamSchema = z.object({
  bookId: z.string().min(1),
});

export class OfflineController {
  constructor(private readonly offlineService = new OfflineService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const data = await this.offlineService.listOfflineBooks(req.user.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const item = await this.offlineService.addOfflineBook(
        req.user.id,
        req.params.bookId,
        req.user.deviceId
      );
      res.status(201).json({ status: 'ok', item });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.offlineService.removeOfflineBook(req.user.id, req.params.bookId);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}
