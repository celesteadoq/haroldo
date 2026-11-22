import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class AdminAuditService {
  async record(params: {
    adminUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
  }) {
    const safeDetails = params.details ? JSON.stringify(params.details) : null;

    return prisma.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: safeDetails,
      },
    });
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    entityType?: string;
    action?: string;
  }) {
    const safePage = Math.max(1, params.page);
    const safeLimit = Math.min(50, Math.max(1, params.limit));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.AdminAuditLogWhereInput = {
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.search
        ? {
            OR: [
              { action: { contains: params.search } },
              { entityId: { contains: params.search } },
              { details: { contains: params.search } },
              { adminUser: { name: { contains: params.search } } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          adminUser: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }
}
