import { BookAccessTier } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { getBrasiliaReferenceMonth, SubscriptionService } from './subscription.service';

export interface BookAccessEvaluation {
  accessLevel: BookAccessTier;
  requiredPlanName: 'Gratuito' | 'Básico' | 'Premium';
  canReadPreview: boolean;
  canReadFull: boolean;
  canUnlockMonthly: boolean;
  hasOfflineAccess: boolean;
  isMonthlyUnlocked: boolean;
  reason: 'ALLOWED' | 'LOGIN_REQUIRED' | 'PLAN_UPGRADE_REQUIRED';
  userPlanName: string | null;
}

export interface UserPlanContext {
  planName: string | null;
  monthlyBookLimit: number | null;
  hasOfflineReading: boolean;
  unlockedBookIds: Set<string>;
  monthlyUnlocksUsed: number;
}

export class BookAccessService {
  constructor(private readonly subscriptionService = new SubscriptionService()) {}

  async getUserPlanContext(userId?: string): Promise<UserPlanContext> {
    if (!userId) {
      return {
        planName: null,
        monthlyBookLimit: null,
        hasOfflineReading: false,
        unlockedBookIds: new Set<string>(),
        monthlyUnlocksUsed: 0,
      };
    }

    const activeSub = await this.subscriptionService.reconcileUserSubscription(userId);
    const currentMonth = getBrasiliaReferenceMonth();

    const allUnlocks = await prisma.monthlyBookUnlock.findMany({
      where: { userId },
      select: { bookId: true, referenceMonth: true },
    });

    const monthlyUnlocksUsed = allUnlocks.filter(
      (item) => item.referenceMonth === currentMonth
    ).length;

    return {
      planName: activeSub?.plan.name ?? 'Gratuito',
      monthlyBookLimit: activeSub?.plan.monthlyBookLimit ?? 1,
      hasOfflineReading: activeSub?.plan.hasOfflineReading ?? false,
      unlockedBookIds: new Set(allUnlocks.map((item) => item.bookId)),
      monthlyUnlocksUsed,
    };
  }

  evaluateBookAccess(
    book: { id: string; accessTier: BookAccessTier; isFreeEligible: boolean },
    userContext: UserPlanContext
  ): BookAccessEvaluation {
    const requiredPlanName: 'Gratuito' | 'Básico' | 'Premium' =
      book.isFreeEligible || book.accessTier === BookAccessTier.FREE
        ? 'Gratuito'
        : book.accessTier === BookAccessTier.BASIC
          ? 'Básico'
          : 'Premium';

    const planName = userContext.planName;
    const isMonthlyUnlocked = userContext.unlockedBookIds.has(book.id);

    if (!planName) {
      return {
        accessLevel: book.accessTier,
        requiredPlanName,
        canReadPreview: book.isFreeEligible || book.accessTier === BookAccessTier.FREE,
        canReadFull: false,
        canUnlockMonthly: false,
        hasOfflineAccess: false,
        isMonthlyUnlocked: false,
        reason: book.isFreeEligible ? 'ALLOWED' : 'LOGIN_REQUIRED',
        userPlanName: null,
      };
    }

    if (planName === 'Premium') {
      return {
        accessLevel: book.accessTier,
        requiredPlanName,
        canReadPreview: true,
        canReadFull: true,
        canUnlockMonthly: false,
        hasOfflineAccess: userContext.hasOfflineReading,
        isMonthlyUnlocked,
        reason: 'ALLOWED',
        userPlanName: planName,
      };
    }

    if (planName === 'Básico') {
      const includedInBasic = book.accessTier !== BookAccessTier.PREMIUM;
      return {
        accessLevel: book.accessTier,
        requiredPlanName,
        canReadPreview: true,
        canReadFull: includedInBasic,
        canUnlockMonthly: false,
        hasOfflineAccess: includedInBasic && userContext.hasOfflineReading,
        isMonthlyUnlocked,
        reason: includedInBasic ? 'ALLOWED' : 'PLAN_UPGRADE_REQUIRED',
        userPlanName: planName,
      };
    }

    const canReadPreview = book.isFreeEligible || book.accessTier === BookAccessTier.FREE;
    const canReadFull = book.isFreeEligible && isMonthlyUnlocked;
    const quotaLimit = userContext.monthlyBookLimit ?? 1;
    const canUnlockMonthly =
      book.isFreeEligible && !isMonthlyUnlocked && userContext.monthlyUnlocksUsed < quotaLimit;

    return {
      accessLevel: book.accessTier,
      requiredPlanName,
      canReadPreview,
      canReadFull,
      canUnlockMonthly,
      hasOfflineAccess: false,
      isMonthlyUnlocked,
      reason: canReadPreview || canReadFull ? 'ALLOWED' : 'PLAN_UPGRADE_REQUIRED',
      userPlanName: planName,
    };
  }

  async unlockMonthlyBook(userId: string, slug: string) {
    const book = await prisma.book.findFirst({ where: { slug, isActive: true } });
    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    if (!book.isFreeEligible) {
      throw new AppError(
        'Este livro não está habilitado para desbloqueio mensal gratuito.',
        403,
        { code: 'BOOK_NOT_FREE_ELIGIBLE' }
      );
    }

    const context = await this.getUserPlanContext(userId);
    if (context.unlockedBookIds.has(book.id)) {
      return { unlocked: true, alreadyUnlocked: true, referenceMonth: null };
    }

    const quotaLimit = context.monthlyBookLimit ?? 1;
    if (context.monthlyUnlocksUsed >= quotaLimit) {
      throw new AppError(
        'Você já utilizou sua cota mensal de desbloqueio gratuito. A cota renova no dia 1º (horário de Brasília).',
        403,
        { code: 'MONTHLY_UNLOCK_QUOTA_REACHED' }
      );
    }

    const referenceMonth = getBrasiliaReferenceMonth();
    await prisma.monthlyBookUnlock.create({
      data: {
        userId,
        bookId: book.id,
        referenceMonth,
      },
    });

    return { unlocked: true, alreadyUnlocked: false, referenceMonth };
  }
}
