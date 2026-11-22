import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { AuthService } from './auth.service';
import { DeviceService } from './device.service';

export class AccountService {
  constructor(
    private readonly authService = new AuthService(),
    private readonly deviceService = new DeviceService()
  ) {}

  async getProfile(userId: string) {
    return this.authService.getSafeUserById(userId);
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      preferredLanguage?: string;
      preferredTheme?: string;
      emailNotifications?: boolean;
    }
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.preferredLanguage !== undefined
          ? { preferredLanguage: data.preferredLanguage }
          : {}),
        ...(data.preferredTheme !== undefined ? { preferredTheme: data.preferredTheme } : {}),
        ...(data.emailNotifications !== undefined
          ? { emailNotifications: data.emailNotifications }
          : {}),
      },
    });

    return this.authService.getSafeUserById(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new AppError('A senha atual está incorreta.', 400, {
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });
  }

  async listDevices(userId: string, currentDeviceId: string) {
    return this.deviceService.listUserDevices(userId, currentDeviceId);
  }

  async disconnectDevice(userId: string, deviceId: string, currentDeviceId: string) {
    return this.deviceService.disconnectDevice(userId, deviceId, currentDeviceId);
  }
}
