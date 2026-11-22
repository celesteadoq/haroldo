import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { NotificationService } from './notification.service';
import { paymentProvider } from './paymentProvider';

export function getBrasiliaReferenceMonth(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? String(date.getUTCFullYear());
  const month =
    parts.find((p) => p.type === 'month')?.value ?? String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export class SubscriptionService {
  constructor(private readonly notificationService = new NotificationService()) {}

  async listPlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlanById(planId: string) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, isActive: true },
    });
    if (!plan) throw new AppError('Plano não encontrado.', 404);
    return plan;
  }

  async reconcileUserSubscription(userId: string) {
    const now = new Date();
    const current = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true, pendingPlan: true },
    });

    if (!current) {
      const freePlan = await prisma.plan.findUnique({ where: { name: 'Gratuito' } });
      if (!freePlan) return null;

      return prisma.subscription.create({
        data: {
          userId,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
        },
        include: { plan: true, pendingPlan: true },
      });
    }

    if (
      current.status === SubscriptionStatus.TRIALING &&
      !current.cancelAtPeriodEnd &&
      current.trialEndDate
    ) {
      const msLeft = current.trialEndDate.getTime() - now.getTime();
      if (msLeft > 0 && msLeft <= 48 * 60 * 60 * 1000) {
        await this.notificationService.createUnique({
          userId,
          category: 'RENOVAÇÃO',
          title: 'Seu teste gratuito termina em breve',
          message: `Seu teste Premium encerra em ${current.trialEndDate.toLocaleDateString('pt-BR')}. Confirme sua assinatura para manter os benefícios.`,
          actionUrl: '/minha-assinatura',
          dedupeKey: `trial-ending-${current.id}`,
        });
      }
    }

    const expiredTrial =
      current.status === SubscriptionStatus.TRIALING &&
      current.trialEndDate &&
      current.trialEndDate <= now;
    const endedPaidPeriod =
      current.status === SubscriptionStatus.ACTIVE && current.endDate && current.endDate <= now;

    if (expiredTrial || (endedPaidPeriod && current.cancelAtPeriodEnd)) {
      const freePlan = await prisma.plan.findUnique({ where: { name: 'Gratuito' } });

      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: current.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        if (freePlan) {
          const nextSub = await tx.subscription.create({
            data: {
              userId,
              planId: freePlan.id,
              status: SubscriptionStatus.ACTIVE,
              startDate: now,
            },
          });

          await tx.subscriptionHistory.create({
            data: {
              subscriptionId: nextSub.id,
              userId,
              fromPlanId: current.planId,
              toPlanId: freePlan.id,
              action: 'EXPIRED_TO_FREE',
              notes: expiredTrial
                ? 'Encerramento do período de teste gratuito.'
                : 'Encerramento do período após cancelamento.',
            },
          });
        }
      });

      await this.notificationService.createUnique({
        userId,
        category: 'ASSINATURA',
        title: 'Assinatura encerrada',
        message:
          'Sua conta voltou ao plano Gratuito. Sua biblioteca e progresso foram preservados.',
        actionUrl: '/planos',
        dedupeKey: `expired-${current.id}`,
      });

      return this.reconcileUserSubscription(userId);
    }

    if (endedPaidPeriod && current.pendingPlanId && !current.cancelAtPeriodEnd) {
      const targetPlan = current.pendingPlan;
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: current.id },
          data: {
            planId: current.pendingPlanId!,
            pendingPlanId: null,
            startDate: now,
            endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: current.id,
            userId,
            fromPlanId: current.planId,
            toPlanId: current.pendingPlanId!,
            action: 'DOWNGRADE_APPLIED',
            notes: `Alteração aplicada ao término do ciclo para ${targetPlan?.name ?? 'novo plano'}.`,
          },
        });
      });

      await this.notificationService.createUnique({
        userId,
        category: 'ASSINATURA',
        title: 'Alteração de plano aplicada',
        message: `Seu plano agora é ${targetPlan?.name ?? 'Básico'}.`,
        actionUrl: '/minha-assinatura',
        dedupeKey: `downgrade-${current.id}-${current.pendingPlanId}`,
      });

      return prisma.subscription.findUnique({
        where: { id: current.id },
        include: { plan: true, pendingPlan: true },
      });
    }

    return current;
  }

  async getCurrentDetails(userId: string) {
    const subscription = await this.reconcileUserSubscription(userId);
    const [user, activeDevices, offlineCount, history] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { trialUsedAt: true } }),
      prisma.device.count({ where: { userId, isActive: true } }),
      prisma.offlineBook.count({ where: { userId, status: { not: 'REVOKED' } } }),
      prisma.subscriptionHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          fromPlan: { select: { name: true } },
          toPlan: { select: { name: true } },
        },
      }),
    ]);

    return {
      subscription,
      trialEligible: !user?.trialUsedAt,
      usage: {
        activeDevices,
        maxDevices: subscription?.plan.maxDevices ?? 1,
        offlineBooks: offlineCount,
        offlineBookLimit: subscription?.plan.offlineBookLimit ?? 0,
      },
      history,
    };
  }

  async startPremiumTrial(userId: string) {
    const [user, current, premiumPlan] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, trialUsedAt: true } }),
      this.reconcileUserSubscription(userId),
      prisma.plan.findUnique({ where: { name: 'Premium' } }),
    ]);

    if (!user || !premiumPlan) {
      throw new AppError('Plano Premium não configurado.', 500);
    }

    if (user.trialUsedAt) {
      throw new AppError(
        'O teste gratuito de 7 dias já foi utilizado anteriormente nesta conta.',
        400,
        { code: 'TRIAL_ALREADY_USED' }
      );
    }

    if (current?.plan.name === 'Premium') {
      throw new AppError('Você já possui o plano Premium ativo.', 400);
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const createdSub = await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.subscription.update({
          where: { id: current.id },
          data: { status: SubscriptionStatus.CANCELED, canceledAt: now },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { trialUsedAt: now },
      });

      const sub = await tx.subscription.create({
        data: {
          userId,
          planId: premiumPlan.id,
          status: SubscriptionStatus.TRIALING,
          isTrial: true,
          startDate: now,
          trialStartDate: now,
          trialEndDate: trialEnd,
          endDate: trialEnd,
        },
        include: { plan: true },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          userId,
          fromPlanId: current?.planId ?? null,
          toPlanId: premiumPlan.id,
          action: 'TRIAL_STARTED',
          notes: 'Teste gratuito Premium de 7 dias ativado (R$ 0,00).',
        },
      });

      return sub;
    });

    await this.notificationService.createUnique({
      userId,
      category: 'ASSINATURA',
      title: 'Teste gratuito Premium ativado',
      message: `Seu acesso Premium está liberado até ${trialEnd.toLocaleDateString('pt-BR')} sem cobrança inicial.`,
      actionUrl: '/minha-assinatura',
      dedupeKey: `trial-started-${createdSub.id}`,
    });

    return createdSub;
  }

  async simulateCheckoutAndActivate(params: {
    userId: string;
    planId: string;
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    idempotencyKey?: string;
  }) {
    const { userId, planId, idempotencyKey } = params;

    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
      });
      if (existingPayment) {
        if (existingPayment.userId !== userId) {
          throw new AppError('Chave de idempotência inválida.', 403);
        }
        const current = await this.reconcileUserSubscription(userId);
        return {
          approved: existingPayment.status === PaymentStatus.PAID,
          payment: existingPayment,
          subscription: current,
        };
      }
    }

    const [plan, current] = await Promise.all([
      this.getPlanById(planId),
      this.reconcileUserSubscription(userId),
    ]);

    if (plan.price <= 0) {
      throw new AppError('O plano Gratuito não exige pagamento.', 400);
    }

    if (
      current &&
      current.planId === plan.id &&
      current.status === SubscriptionStatus.ACTIVE &&
      !current.cancelAtPeriodEnd
    ) {
      throw new AppError('Este plano já está ativo na sua conta.', 400);
    }

    const amount = plan.price;

    const chargeResult = await paymentProvider.processCardPayment({
      amount,
      cardNumber: params.cardNumber,
      cardHolderName: params.cardHolderName,
      expiryMonth: params.expiryMonth,
      expiryYear: params.expiryYear,
      cvv: params.cvv,
    });

    const now = new Date();
    const nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (!chargeResult.approved) {
      const targetSubId =
        current?.id ??
        (
          await prisma.subscription.create({
            data: {
              userId,
              planId: plan.id,
              status: SubscriptionStatus.PENDING,
              startDate: now,
            },
          })
        ).id;

      const failedPayment = await prisma.payment.create({
        data: {
          userId,
          subscriptionId: targetSubId,
          planId: plan.id,
          amount,
          status: PaymentStatus.FAILED,
          paymentMethod: `Cartão ${chargeResult.cardBrand} •••• ${chargeResult.cardLast4}`,
          cardBrand: chargeResult.cardBrand,
          cardLast4: chargeResult.cardLast4,
          failureReason: chargeResult.failureReason,
          transactionReference: chargeResult.transactionReference,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
      });

      await this.notificationService.createUnique({
        userId,
        category: 'PAGAMENTO',
        title: 'Pagamento não aprovado',
        message:
          chargeResult.failureReason ?? 'Seu cartão foi recusado. Nenhuma cobrança foi realizada.',
        actionUrl: `/checkout/${plan.id}`,
        dedupeKey: `payment-failed-${failedPayment.id}`,
      });

      throw new AppError(chargeResult.failureReason ?? 'Não foi possível validar o cartão.', 402, {
        code: 'PAYMENT_DECLINED',
        paymentId: failedPayment.id,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.subscription.update({
          where: { id: current.id },
          data: { status: SubscriptionStatus.CANCELED, canceledAt: now },
        });
      }

      const newSub = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
          startDate: now,
          endDate: nextBilling,
          cancelAtPeriodEnd: false,
        },
        include: { plan: true },
      });

      const payment = await tx.payment.create({
        data: {
          userId,
          subscriptionId: newSub.id,
          planId: plan.id,
          amount,
          status: PaymentStatus.PAID,
          paymentMethod: `Cartão ${chargeResult.cardBrand} •••• ${chargeResult.cardLast4}`,
          cardBrand: chargeResult.cardBrand,
          cardLast4: chargeResult.cardLast4,
          transactionReference: chargeResult.transactionReference,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: newSub.id,
          userId,
          fromPlanId: current?.planId ?? null,
          toPlanId: plan.id,
          action: current?.plan.price ? 'PLAN_UPGRADED' : 'SUBSCRIPTION_ACTIVATED',
          notes: `Assinatura ${plan.name} ativada via pagamento simulado (${payment.transactionReference}).`,
        },
      });

      return { subscription: newSub, payment };
    });

    await this.notificationService.createUnique({
      userId,
      category: 'PAGAMENTO',
      title: `Assinatura ${plan.name} ativada`,
      message: `Pagamento simulado de R$ ${amount.toFixed(2).replace('.', ',')} aprovado. Próxima renovação em ${nextBilling.toLocaleDateString('pt-BR')}.`,
      actionUrl: '/minha-assinatura',
      dedupeKey: `payment-paid-${result.payment.id}`,
    });

    return {
      approved: true,
      ...result,
    };
  }

  async requestPlanChange(userId: string, targetPlanId: string) {
    const [targetPlan, current, user] = await Promise.all([
      this.getPlanById(targetPlanId),
      this.reconcileUserSubscription(userId),
      prisma.user.findUnique({ where: { id: userId }, select: { trialUsedAt: true } }),
    ]);

    if (!current) throw new AppError('Assinatura atual não encontrada.', 404);

    if (current.planId === targetPlan.id && !current.cancelAtPeriodEnd) {
      throw new AppError('Você já está neste plano.', 400);
    }

    if (targetPlan.name === 'Gratuito') {
      return {
        nextAction: 'CANCEL_CURRENT',
        message: 'Para migrar para o Gratuito, cancele a renovação da assinatura atual.',
      };
    }

    if (targetPlan.name === 'Premium' && !user?.trialUsedAt && current.plan.name === 'Gratuito') {
      return {
        nextAction: 'OFFER_TRIAL',
        plan: targetPlan,
        message: 'Sua conta é elegível para 7 dias grátis no Premium.',
      };
    }

    if (targetPlan.price > current.plan.price) {
      return {
        nextAction: 'CHECKOUT',
        plan: targetPlan,
        message: `Prossiga para o checkout para ativar o plano ${targetPlan.name}.`,
      };
    }

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: current.id },
        data: { pendingPlanId: targetPlan.id, cancelAtPeriodEnd: false },
      }),
      prisma.subscriptionHistory.create({
        data: {
          subscriptionId: current.id,
          userId,
          fromPlanId: current.planId,
          toPlanId: targetPlan.id,
          action: 'DOWNGRADE_SCHEDULED',
          notes: `Downgrade para ${targetPlan.name} agendado para o término do período atual.`,
        },
      }),
    ]);

    await this.notificationService.createUnique({
      userId,
      category: 'ASSINATURA',
      title: 'Mudança de plano agendada',
      message: `Seu plano será alterado para ${targetPlan.name} ao final do ciclo vigente.`,
      actionUrl: '/minha-assinatura',
      dedupeKey: `downgrade-scheduled-${current.id}-${targetPlan.id}`,
    });

    return {
      nextAction: 'DOWNGRADE_SCHEDULED',
      plan: targetPlan,
      message: `Alteração para ${targetPlan.name} agendada para o final do período atual.`,
    };
  }

  async cancelSubscription(userId: string) {
    const current = await this.reconcileUserSubscription(userId);
    if (!current || current.plan.name === 'Gratuito') {
      throw new AppError('Não há assinatura paga ou teste ativo para cancelar.', 400);
    }

    if (current.cancelAtPeriodEnd) {
      throw new AppError('O cancelamento desta assinatura já está agendado.', 400);
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id: current.id },
        data: {
          cancelAtPeriodEnd: true,
          pendingPlanId: null,
          canceledAt: now,
        },
        include: { plan: true },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: current.id,
          userId,
          fromPlanId: current.planId,
          toPlanId: current.planId,
          action: current.isTrial ? 'TRIAL_CANCELED' : 'SUBSCRIPTION_CANCELED',
          notes: current.isTrial
            ? 'Teste gratuito cancelado antes da cobrança.'
            : 'Renovação cancelada; acesso mantido até o término do período pago.',
        },
      });

      return sub;
    });

    const accessUntil = (updated.trialEndDate ?? updated.endDate)?.toLocaleDateString('pt-BR');
    await this.notificationService.createUnique({
      userId,
      category: 'RENOVAÇÃO',
      title: 'Renovação cancelada',
      message: accessUntil
        ? `Nenhuma nova cobrança será feita. Seu acesso continua até ${accessUntil}.`
        : 'Nenhuma nova cobrança será realizada.',
      actionUrl: '/minha-assinatura',
      dedupeKey: `canceled-${updated.id}`,
    });

    return updated;
  }

  async listPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
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
        plan: { select: { id: true, name: true } },
      },
    });
  }

  async getPaymentById(userId: string, paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        paymentMethod: true,
        cardBrand: true,
        cardLast4: true,
        failureReason: true,
        transactionReference: true,
        createdAt: true,
        plan: { select: { id: true, name: true } },
      },
    });

    if (!payment || payment.userId !== userId) {
      throw new AppError('Pagamento não encontrado.', 404);
    }

    return payment;
  }
}
