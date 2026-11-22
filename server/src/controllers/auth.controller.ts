import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { resolveDeviceIdentifier } from '../services/device.service';
import {
  DEVICE_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  setAuthCookies,
} from '../utils/cookies';
import { AppError } from '../utils/AppError';

const passwordSchema = z
  .string()
  .min(8, 'A senha deve possuir no mínimo 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter letras e números.')
  .regex(/\d/, 'A senha deve conter letras e números.');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome completo.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Token de recuperação inválido.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  });

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deviceIdentifier = resolveDeviceIdentifier(req.cookies?.[DEVICE_COOKIE_NAME]);
      const result = await this.authService.register({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        deviceIdentifier,
        userAgent: req.headers['user-agent'],
      });

      setAuthCookies(res, result.accessToken, result.refreshToken, deviceIdentifier, false);
      res.status(201).json({
        status: 'ok',
        message: 'Conta criada com sucesso.',
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deviceIdentifier = resolveDeviceIdentifier(req.cookies?.[DEVICE_COOKIE_NAME]);
      const result = await this.authService.login({
        email: req.body.email,
        password: req.body.password,
        rememberMe: req.body.rememberMe,
        deviceIdentifier,
        userAgent: req.headers['user-agent'],
      });

      setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
        deviceIdentifier,
        req.body.rememberMe
      );

      res.status(200).json({
        status: 'ok',
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
      if (!rawRefreshToken) {
        clearAuthCookies(res);
        throw new AppError('Sessão não encontrada.', 401);
      }

      const result = await this.authService.refresh(rawRefreshToken);
      setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
        result.deviceIdentifier,
        false
      );

      res.status(200).json({
        status: 'ok',
        user: result.user,
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
      await this.authService.logout({
        userId: req.user?.id,
        deviceId: req.user?.deviceId,
        rawRefreshToken,
      });
      clearAuthCookies(res);
      res.status(200).json({ status: 'ok', message: 'Sessão encerrada.' });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Autenticação necessária.', 401);
      }
      const user = await this.authService.getSafeUserById(req.user.id);
      res.status(200).json({ status: 'ok', user });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.forgotPassword(req.body.email);
      res.status(200).json({
        status: 'ok',
        message:
          'Se existir uma conta com o e-mail informado, as instruções de recuperação estarão disponíveis.',
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body.token, req.body.password);
      clearAuthCookies(res);
      res.status(200).json({
        status: 'ok',
        message: 'Nova senha salva com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  };
}
