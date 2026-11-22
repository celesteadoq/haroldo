import { PaymentStatus, Prisma, SubscriptionStatus, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { AdminAuditService } from './adminAudit.service';

export class AdminCommercialService {
  constructor(private readonly auditService = new AdminAuditService()) {}

  async listUsers(params: {
    page: number;
    limit: number;
    search?: string;
    planId?: string;
    status?: 'active' | 'blocked' | 'all';
  }) {
    const safePage = Math.max(1, params.page);
    const safeLimit = Math.min(50, Math.max(1, params.limit));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.UserWhereInput = {
      ...(params.status === 'active'
        ? { isBlocked: false }
        : params.status === 'blocked'
          ? { isBlocked: true }
          : {}),
      ...(params.search
        ? {
            OR: [{ name: { contains: params.search } }, { email: { contains: params.search } }],
          }
        : {}),
      ...(params.planId
        ? {
            subscriptions: {
              some: {
                planId: params.planId,
                status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
              },
            },
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          subscriptions: {
            where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: { select: { id: true, name: true, price: true } } },
          },
        },
      }),
    ]);

    return {
      items: users,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        trialUsedAt: true,
        preferredLanguage: true,
        preferredTheme: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            cardBrand: true,
            cardLast4: true,
            failureReason: true,
            transactionReference: true,
            createdAt: true,
            plan: { select: { name: true } },
          },
        },
        devices: {
          where: { isActive: true },
          select: { id: true, deviceName: true, firstAccessAt: true, lastActiveAt: true },
        },
        readingHistory: {
          orderBy: { lastReadAt: 'desc' },
          take: 10,
          include: { book: { select: { id: true, title: true, slug: true } } },
        },
      },
    });

    if (!user) throw new AppError('Usuário não encontrado.', 404);
    return user;
  }

  async updateUserAccess(
    actingAdminId: string,
    targetUserId: string,
    data: { isBlocked?: boolean; role?: UserRole }
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new AppError('Usuário não encontrado.', 404);

    if (targetUserId === actingAdminId) {
      if (data.role && data.role !== UserRole.ADMIN) {
        throw new AppError('Você não pode remover sua própria permissão de administrador.', 400);
      }
      if (data.isBlocked === true) {
        throw new AppError('Você não pode bloquear sua própria conta.', 400);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: {
          ...(data.isBlocked !== undefined ? { isBlocked: data.isBlocked } : {}),
          ...(data.role !== undefined ? { role: data.role } : {}),
        },
        select: { id: true, name: true, email: true, role: true, isBlocked: true },
      });

      if (data.isBlocked === true) {
        await tx.refreshToken.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.device.updateMany({
          where: { userId: targetUserId, isActive: true },
          data: { isActive: false, sessionTokenId: null },
        });
      }

      return user;
    });

    const action = data.role
      ? 'USER_ROLE_CHANGE'
      : data.isBlocked === true
        ? 'USER_BLOCK'
        : 'USER_UNBLOCK';

    await this.auditService.record({
      adminUserId: actingAdminId,
      action,
      entityType: 'User',
      entityId: targetUserId,
      details: { role: updated.role, isBlocked: updated.isBlocked },
    });

    return updated;
  }

  async listPlans() {
    return prisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
            },
          },
        },
      },
    });
  }

  async updatePlan(
    adminUserId: string,
    planId: string,
    data: {
      description?: string;
      maxDevices?: number;
      offlineBookLimit?: number;
      monthlyBookLimit?: number | null;
      hasAds?: boolean;
      hasOfflineReading?: boolean;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.plan.findUnique({ where: { id: planId } });
    if (!existing) throw new AppError('Plano não encontrado.', 404);

    const updated = await prisma.plan.update({
      where: { id: planId },
      data,
    });

    await this.auditService.record({
      adminUserId,
      action: 'PLAN_UPDATE',
      entityType: 'Plan',
      entityId: planId,
      details: {
        name: updated.name,
        maxDevices: updated.maxDevices,
        offlineBookLimit: updated.offlineBookLimit,
      },
    });

    return updated;
  }

  async listSubscriptions(params: {
    page: number;
    limit: number;
    search?: string;
    planId?: string;
    status?: SubscriptionStatus;
  }) {
    const safePage = Math.max(1, params.page);
    const safeLimit = Math.min(50, Math.max(1, params.limit));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.SubscriptionWhereInput = {
      ...(params.planId ? { planId: params.planId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            user: {
              OR: [{ name: { contains: params.search } }, { email: { contains: params.search } }],
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true, price: true } },
          pendingPlan: { select: { id: true, name: true } },
          history: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              fromPlan: { select: { name: true } },
              toPlan: { select: { name: true } },
            },
          },
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

  async adminUpdateSubscription(
    adminUserId: string,
    subscriptionId: string,
    data: { status?: SubscriptionStatus; cancelAtPeriodEnd?: boolean }
  ) {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new AppError('Assinatura não encontrada.', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.cancelAtPeriodEnd !== undefined
            ? { cancelAtPeriodEnd: data.cancelAtPeriodEnd }
            : {}),
        },
        include: { plan: true, user: { select: { id: true, name: true, email: true } } },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          userId: sub.userId,
          fromPlanId: sub.planId,
          toPlanId: sub.planId,
          action: 'ADMIN_STATUS_UPDATED',
          notes: `Status administrativo atualizado para ${next.status}.`,
        },
      });

      return next;
    });

    await this.auditService.record({
      adminUserId,
      action: 'SUBSCRIPTION_ADMIN_UPDATE',
      entityType: 'Subscription',
      entityId: subscriptionId,
      details: { status: updated.status, cancelAtPeriodEnd: updated.cancelAtPeriodEnd },
    });

    return updated;
  }

  async listPayments(params: {
    page: number;
    limit: number;
    search?: string;
    status?: PaymentStatus;
    period?: '7d' | '30d' | '90d' | 'all';
  }) {
    const safePage = Math.max(1, params.page);
    const safeLimit = Math.min(50, Math.max(1, params.limit));
    const skip = (safePage - 1) * safeLimit;

    const days =
      params.period === '7d' ? 7 : params.period === '30d' ? 30 : params.period === '90d' ? 90 : null;
    const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;

    const where: Prisma.PaymentWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
      ...(params.search
        ? {
            user: {
              OR: [{ name: { contains: params.search } }, { email: { contains: params.search } }],
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          cardBrand: true,
          cardLast4: true,
          failureReason: true,
          transactionReference: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true } },
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
