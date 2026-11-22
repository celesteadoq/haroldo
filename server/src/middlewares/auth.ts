import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { verifyAccessToken } from '../services/token.service';
import { ACCESS_COOKIE_NAME } from '../utils/cookies';
import { AppError } from '../utils/AppError';

async function resolveAuthenticatedUser(req: Request) {
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken || bearerToken;

  if (!token) return undefined;

  const payload = verifyAccessToken(token);

  const [user, session, device] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, isBlocked: true },
    }),
    prisma.refreshToken.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, revokedAt: true, expiresAt: true },
    }),
    prisma.device.findUnique({
      where: { id: payload.deviceId },
      select: { id: true, isActive: true },
    }),
  ]);

  if (
    !user ||
    !session ||
    session.revokedAt !== null ||
    session.expiresAt <= new Date() ||
    !device ||
    !device.isActive
  ) {
    return undefined;
  }

  if (user.isBlocked) {
    throw new AppError('Conta suspensa ou bloqueada pelo administrador.', 403, {
      code: 'USER_BLOCKED',
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    deviceId: device.id,
    sessionId: session.id,
  };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      next(new AppError('Autenticação necessária.', 401));
      return;
    }
    req.user = authUser;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Sessão inválida ou expirada.', 401));
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    req.user = await resolveAuthenticatedUser(req);
  } catch {
    req.user = undefined;
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Autenticação necessária.', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Você não tem permissão para acessar este recurso.', 403));
      return;
    }

    next();
  };
}
