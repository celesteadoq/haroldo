import crypto from 'node:crypto';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export function parseDeviceNameFromUserAgent(userAgent?: string): string {
  if (!userAgent) return 'Navegador Web';

  let browser = 'Navegador';
  if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium/')) browser = 'Chrome';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';

  let os = 'Dispositivo';
  if (userAgent.includes('iPhone')) os = 'iPhone';
  else if (userAgent.includes('iPad')) os = 'iPad';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return `${browser} • ${os}`;
}

export function resolveDeviceIdentifier(cookieDeviceId?: string): string {
  if (cookieDeviceId && /^[a-zA-Z0-9-]{16,80}$/.test(cookieDeviceId)) {
    return cookieDeviceId;
  }
  return crypto.randomUUID();
}

export class DeviceService {
  async getUserMaxDevices(userId: string): Promise<number> {
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (activeSub?.plan) {
      return activeSub.plan.maxDevices;
    }

    const freePlan = await prisma.plan.findUnique({ where: { name: 'Gratuito' } });
    return freePlan?.maxDevices ?? 1;
  }

  async ensureDeviceSlotForSession(params: {
    userId: string;
    deviceIdentifier: string;
    userAgent?: string;
  }) {
    const { userId, deviceIdentifier, userAgent } = params;
    const deviceName = parseDeviceNameFromUserAgent(userAgent);
    const maxDevices = await this.getUserMaxDevices(userId);

    const existingDevice = await prisma.device.findUnique({
      where: {
        userId_deviceIdentifier: { userId, deviceIdentifier },
      },
    });

    if (existingDevice && existingDevice.isActive) {
      return prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          deviceName,
          userAgent: userAgent ?? existingDevice.userAgent,
          lastActiveAt: new Date(),
        },
      });
    }

    const activeCount = await prisma.device.count({
      where: { userId, isActive: true },
    });

    if (activeCount >= maxDevices) {
      throw new AppError(
        `Limite de ${maxDevices} dispositivo(s) do seu plano atingido. Desconecte outro dispositivo para continuar.`,
        403,
        {
          code: 'DEVICE_LIMIT_REACHED',
          maxDevices,
          activeDevices: activeCount,
        }
      );
    }

    if (existingDevice) {
      return prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          deviceName,
          userAgent: userAgent ?? null,
          isActive: true,
          lastActiveAt: new Date(),
        },
      });
    }

    return prisma.device.create({
      data: {
        userId,
        deviceIdentifier,
        deviceName,
        userAgent: userAgent ?? null,
        isActive: true,
      },
    });
  }

  async listUserDevices(userId: string, currentDeviceId: string) {
    const [devices, maxDevices] = await Promise.all([
      prisma.device.findMany({
        where: { userId, isActive: true },
        orderBy: { lastActiveAt: 'desc' },
        select: {
          id: true,
          deviceName: true,
          firstAccessAt: true,
          lastActiveAt: true,
          isActive: true,
        },
      }),
      this.getUserMaxDevices(userId),
    ]);

    return {
      maxDevices,
      devices: devices.map((d) => ({
        ...d,
        isCurrent: d.id === currentDeviceId,
      })),
    };
  }

  async disconnectDevice(userId: string, deviceId: string, currentDeviceId: string) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== userId) {
      throw new AppError('Dispositivo não encontrado.', 404);
    }

    await prisma.$transaction([
      prisma.device.update({
        where: { id: device.id },
        data: {
          isActive: false,
          sessionTokenId: null,
        },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId,
          deviceId: device.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      disconnectedCurrentDevice: device.id === currentDeviceId,
    };
  }
}
