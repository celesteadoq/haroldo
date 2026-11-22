import type { NextFunction, Request, Response } from 'express';
import { HealthService } from '../services/health.service';

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  check = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.healthService.getHealthStatus();
      const statusCode = result.database === 'connected' ? 200 : 503;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };
}
