import { ReadingStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { LibraryService } from '../services/library.service';
import { AppError } from '../utils/AppError';

export const bookIdParamSchema = z.object({
  bookId: z.string().min(1),
});

export const libraryQuerySchema = z.object({
  status: z.nativeEnum(ReadingStatus).optional(),
});

export const addLibraryBodySchema = z.object({
  status: z.nativeEnum(ReadingStatus).optional().default(ReadingStatus.WANT_TO_READ),
});

export const updateLibraryBodySchema = z.object({
  status: z.nativeEnum(ReadingStatus),
});

export const saveProgressBodySchema = z.object({
  currentPage: z.number().int().min(1),
  readingSecondsDelta: z.number().int().min(0).max(300).optional().default(0),
  clientTimestamp: z.string().datetime().optional(),
});

export class LibraryController {
  constructor(private readonly libraryService = new LibraryService()) {}

  getLibrary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const query = libraryQuerySchema.parse(req.query);
      const data = await this.libraryService.getLibrary(req.user.id, query.status);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  addToLibrary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const item = await this.libraryService.addToLibrary(
        req.user.id,
        req.params.bookId,
        req.body.status
      );
      res.status(200).json({ status: 'ok', item });
    } catch (error) {
      next(error);
    }
  };

  updateLibraryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const item = await this.libraryService.updateLibraryStatus(
        req.user.id,
        req.params.bookId,
        req.body.status
      );
      res.status(200).json({ status: 'ok', item });
    } catch (error) {
      next(error);
    }
  };

  removeFromLibrary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.libraryService.removeFromLibrary(req.user.id, req.params.bookId);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  listFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const items = await this.libraryService.listFavorites(req.user.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const items = await this.libraryService.getReadingHistory(req.user.id);
      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  };

  removeHistoryEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.libraryService.removeHistoryEntry(req.user.id, req.params.bookId);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  listAllProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const data = await this.libraryService.listAllProgress(req.user.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  getBookProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const progress = await this.libraryService.getBookProgress(req.user.id, req.params.bookId);
      res.status(200).json({ progress });
    } catch (error) {
      next(error);
    }
  };

  saveBookProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const result = await this.libraryService.saveBookProgress({
        userId: req.user.id,
        bookId: req.params.bookId,
        currentPage: req.body.currentPage,
        readingSecondsDelta: req.body.readingSecondsDelta,
        clientTimestamp: req.body.clientTimestamp,
      });
      res.status(200).json({ status: 'ok', ...result });
    } catch (error) {
      next(error);
    }
  };
}
