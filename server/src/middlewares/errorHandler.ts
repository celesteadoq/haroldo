import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Dados de requisição inválidos.',
      errors: err.flatten(),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error('Erro interno não tratado:', err);

  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor.',
    ...(env.NODE_ENV === 'development' && err instanceof Error
      ? { debug: err.message }
      : {}),
  });
}
