import bcrypt from 'bcryptjs';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { DeviceService } from './device.service';
import { emailService } from './email.service';
import { generateOpaqueToken, hashToken, signAccessToken } from './token.service';

export class AuthService {
  constructor(private readonly deviceService = new DeviceService()) {}

  private async issueSessionTokens(params: {
    userId: string;
    role: UserRole;
    deviceId: string;
    rememberMe?: boolean;
  }) {
    const { userId, role, deviceId, rememberMe = false } = params;
    const rawRefreshToken = generateOpaqueToken(48);
    const refreshTokenHash = hashToken(rawRefreshToken);

    const days = rememberMe
      ? Math.max(env.REFRESH_TOKEN_EXPIRES_DAYS, 30)
      : env.REFRESH_TOKEN_EXPIRES_DAYS;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const sessionRecord = await prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId, deviceId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      const created = await tx.refreshToken.create({
        data: {
          userId,
          deviceId,
          tokenHash: refreshTokenHash,
          expiresAt,
        },
      });

      await tx.device.update({
        where: { id: deviceId },
        data: {
          sessionTokenId: created.id,
          lastActiveAt: new Date(),
        },
      });

      return created;
    });

    const accessToken = signAccessToken({
      sub: userId,
      role,
      deviceId,
      sessionId: sessionRecord.id,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async getSafeUserById(userId: string) {
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
        emailNotifications: true,
        createdAt: true,
        subscriptions: {
          where: {
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            isTrial: true,
            startDate: true,
            endDate: true,
            trialEndDate: true,
            cancelAtPeriodEnd: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                maxDevices: true,
                offlineBookLimit: true,
                monthlyBookLimit: true,
                hasAds: true,
                hasOfflineReading: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      trialEligible: !user.trialUsedAt,
      preferredLanguage: user.preferredLanguage,
      preferredTheme: user.preferredTheme,
      emailNotifications: user.emailNotifications,
      createdAt: user.createdAt,
      currentSubscription: user.subscriptions[0] ?? null,
    };
  }

  async register(params: {
    name: string;
    email: string;
    password: string;
    deviceIdentifier: string;
    userAgent?: string;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      throw new AppError('Não foi possível concluir o cadastro com os dados informados.', 409, {
        code: 'EMAIL_ALREADY_IN_USE',
      });
    }

    const freePlan = await prisma.plan.findUnique({
      where: { name: 'Gratuito' },
    });

    if (!freePlan) {
      throw new AppError('Plano Gratuito não configurado no banco de dados.', 500);
    }

    const passwordHash = await bcrypt.hash(params.password, 10);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: params.name.trim(),
          email: normalizedEmail,
          password: passwordHash,
          role: UserRole.USER,
        },
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
        },
      });

      return user;
    });

    const device = await this.deviceService.ensureDeviceSlotForSession({
      userId: createdUser.id,
      deviceIdentifier: params.deviceIdentifier,
      userAgent: params.userAgent,
    });

    const tokens = await this.issueSessionTokens({
      userId: createdUser.id,
      role: createdUser.role,
      deviceId: device.id,
    });

    const user = await this.getSafeUserById(createdUser.id);
    return { user, ...tokens };
  }

  async login(params: {
    email: string;
    password: string;
    rememberMe?: boolean;
    deviceIdentifier: string;
    userAgent?: string;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();

    const userRecord = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!userRecord) {
      throw new AppError('E-mail ou senha inválidos.', 401, {
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (userRecord.isBlocked) {
      throw new AppError('Esta conta está bloqueada. Entre em contato com o suporte.', 403, {
        code: 'USER_BLOCKED',
      });
    }

    const passwordValid = await bcrypt.compare(params.password, userRecord.password);
    if (!passwordValid) {
      throw new AppError('E-mail ou senha inválidos.', 401, {
        code: 'INVALID_CREDENTIALS',
      });
    }

    const device = await this.deviceService.ensureDeviceSlotForSession({
      userId: userRecord.id,
      deviceIdentifier: params.deviceIdentifier,
      userAgent: params.userAgent,
    });

    const tokens = await this.issueSessionTokens({
      userId: userRecord.id,
      role: userRecord.role,
      deviceId: device.id,
      rememberMe: params.rememberMe,
    });

    const user = await this.getSafeUserById(userRecord.id);
    return { user, ...tokens };
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        device: true,
      },
    });

    if (!existing) {
      throw new AppError('Sessão inválida ou expirada.', 401);
    }

    if (existing.user.isBlocked) {
      throw new AppError('Conta bloqueada.', 403, { code: 'USER_BLOCKED' });
    }

    if (existing.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: existing.userId, deviceId: existing.deviceId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError('Sessão revogada por segurança. Faça login novamente.', 401);
    }

    if (existing.expiresAt <= new Date() || !existing.device.isActive) {
      throw new AppError('Sessão expirada.', 401);
    }

    const newRawRefreshToken = generateOpaqueToken(48);
    const newHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    const rotated = await prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: existing.userId,
          deviceId: existing.deviceId,
          tokenHash: newHash,
          expiresAt: newExpiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: created.id,
        },
      });

      await tx.device.update({
        where: { id: existing.deviceId },
        data: {
          sessionTokenId: created.id,
          lastActiveAt: new Date(),
        },
      });

      return created;
    });

    const accessToken = signAccessToken({
      sub: existing.userId,
      role: existing.user.role,
      deviceId: existing.deviceId,
      sessionId: rotated.id,
    });

    const user = await this.getSafeUserById(existing.userId);
    return {
      user,
      accessToken,
      refreshToken: newRawRefreshToken,
      deviceIdentifier: existing.device.deviceIdentifier,
    };
  }

  async logout(params: { userId?: string; deviceId?: string; rawRefreshToken?: string }) {
    if (params.rawRefreshToken) {
      const tokenHash = hashToken(params.rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (params.userId && params.deviceId) {
      await prisma.$transaction([
        prisma.refreshToken.updateMany({
          where: { userId: params.userId, deviceId: params.deviceId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        prisma.device.updateMany({
          where: { id: params.deviceId, userId: params.userId },
          data: { isActive: false, sessionTokenId: null },
        }),
      ]);
    }
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return;
    }

    const rawToken = generateOpaqueToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${env.CLIENT_URL}/nova-senha?token=${rawToken}`;
    await emailService.sendPasswordReset({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new AppError('Link de recuperação inválido ou expirado.', 400, {
        code: 'INVALID_OR_EXPIRED_RESET_TOKEN',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.device.updateMany({
        where: { userId: record.userId, isActive: true },
        data: { isActive: false, sessionTokenId: null },
      }),
    ]);
  }
}
