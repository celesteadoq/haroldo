import { HealthRepository } from '../repositories/health.repository';
import type { HealthStatusResponse } from '../types';

export class HealthService {
  constructor(private readonly healthRepository = new HealthRepository()) {}

  async getHealthStatus(): Promise<HealthStatusResponse> {
    const timestamp = new Date().toISOString();

    try {
      await this.healthRepository.checkDatabaseConnection();
      return {
        status: 'ok',
        service: 'biblioflix-api',
        database: 'connected',
        timestamp,
      };
    } catch {
      return {
        status: 'degraded',
        service: 'biblioflix-api',
        database: 'disconnected',
        timestamp,
      };
    }
  }
}
