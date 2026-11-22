import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HelpService } from '../services/help.service';

export const publicHelpQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

export const publicHelpIdSchema = z.object({
  id: z.string().min(1),
});

export class HelpController {
  constructor(private readonly helpService = new HelpService()) {}

  listPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, category } = publicHelpQuerySchema.parse(req.query);
      const items = await this.helpService.listPublicArticles(search, category);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getPublicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const article = await this.helpService.getPublicArticleById(req.params.id);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  };
}
