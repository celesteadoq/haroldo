import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export type DashboardPeriod = '7d' | '30d' | '90d' | 'all';

function getPeriodStartDate(period: DashboardPeriod): Date | undefined {
  if (period === 'all') return undefined;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export class AdminDashboardService {
  async getOverview(period: DashboardPeriod = '30d') {
    const since = getPeriodStartDate(period);
    const dateFilter = since ? { gte: since } : undefined;

    const [
      totalUsers,
      activeUsers,
      usersInPeriod,
      activeSubscribers,
      trialingUsers,
      plans,
      activeSubscriptionsByPlan,
      paidAggregate,
      paidCount,
      failedCount,
      totalBooks,
      activeBooks,
      mostFavoritedRaw,
      mostAccessedRaw,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: dateFilter ? { createdAt: dateFilter } : undefined }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          plan: { price: { gt: 0 } },
        },
      }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.TRIALING } }),
      prisma.plan.findMany({
        orderBy: { price: 'asc' },
        select: { id: true, name: true, price: true },
      }),
      prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
        _count: { _all: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.PAID,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.FAILED,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.book.count(),
      prisma.book.count({ where: { isActive: true } }),
      prisma.favorite.groupBy({
        by: ['bookId'],
        _count: { _all: true },
        orderBy: { _count: { bookId: 'desc' } },
        take: 5,
      }),
      prisma.readingHistory.groupBy({
        by: ['bookId'],
        _count: { _all: true },
        orderBy: { _count: { bookId: 'desc' } },
        take: 5,
      }),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { adminUser: { select: { name: true } } },
      }),
    ]);

    const countByPlanId = new Map(activeSubscriptionsByPlan.map((g) => [g.planId, g._count._all]));
    const planDistribution = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      count: countByPlanId.get(plan.id) ?? 0,
    }));

    const referencedBookIds = Array.from(
      new Set([
        ...mostFavoritedRaw.map((r) => r.bookId),
        ...mostAccessedRaw.map((r) => r.bookId),
      ])
    );

    const booksMap = new Map(
      (
        await prisma.book.findMany({
          where: { id: { in: referencedBookIds } },
          select: { id: true, title: true, slug: true },
        })
      ).map((b) => [b.id, b])
    );

    return {
      period,
      isSimulatedRevenue: true,
      metrics: {
        totalUsers,
        activeUsers,
        usersInPeriod,
        activeSubscribers,
        trialingUsers,
        simulatedRevenue: paidAggregate._sum.amount ?? 0,
        paidPaymentsCount: paidCount,
        failedPaymentsCount: failedCount,
        totalBooks,
        activeBooks,
      },
      planDistribution,
      mostFavoritedBooks: mostFavoritedRaw.map((r) => ({
        bookId: r.bookId,
        title: booksMap.get(r.bookId)?.title ?? 'Livro',
        slug: booksMap.get(r.bookId)?.slug ?? '',
        count: r._count._all,
      })),
      mostAccessedBooks: mostAccessedRaw.map((r) => ({
        bookId: r.bookId,
        title: booksMap.get(r.bookId)?.title ?? 'Livro',
        slug: booksMap.get(r.bookId)?.slug ?? '',
        count: r._count._all,
      })),
      recentActivity: recentAuditLogs,
    };
  }
}
