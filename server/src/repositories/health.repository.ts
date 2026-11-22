import { prisma } from '../config/prisma';

export class HealthRepository {
  async checkDatabaseConnection(): Promise<boolean> {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  }
}
