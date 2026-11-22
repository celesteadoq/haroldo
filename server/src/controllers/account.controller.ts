import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/account.service';
import { clearAuthCookies } from '../utils/cookies';
import { AppError } from '../utils/AppError';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Informe um nome válido.').optional(),
  preferredLanguage: z.enum(['pt-BR', 'en-US']).optional(),
  preferredTheme: z.enum(['dark', 'sepia']).optional(),
  emailNotifications: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve possuir no mínimo 8 caracteres.')
      .regex(/[A-Za-z]/, 'A nova senha deve conter letras e números.')
      .regex(/\d/, 'A nova senha deve conter letras e números.'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmNewPassword'],
  });

export const deviceParamsSchema = z.object({
  id: z.string().min(1),
});

export class AccountController {
  constructor(private readonly accountService = new AccountService()) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const user = await this.accountService.getProfile(req.user.id);
      res.status(200).json({ status: 'ok', user });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const user = await this.accountService.updateProfile(req.user.id, req.body);
      res.status(200).json({ status: 'ok', user });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      await this.accountService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.status(200).json({ status: 'ok', message: 'Senha alterada com sucesso.' });
    } catch (error) {
      next(error);
    }
  };

  listDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const data = await this.accountService.listDevices(req.user.id, req.user.deviceId);
      res.status(200).json({ status: 'ok', ...data });
    } catch (error) {
      next(error);
    }
  };

  disconnectDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError('Autenticação necessária.', 401);
      const result = await this.accountService.disconnectDevice(
        req.user.id,
        req.params.id,
        req.user.deviceId
      );

      if (result.disconnectedCurrentDevice) {
        clearAuthCookies(res);
      }

      res.status(200).json({
        status: 'ok',
        message: 'Dispositivo desconectado.',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
