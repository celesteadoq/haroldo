import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const ACCESS_COOKIE_NAME = 'biblioflix_access_token';
export const REFRESH_COOKIE_NAME = 'biblioflix_refresh_token';
export const DEVICE_COOKIE_NAME = 'biblioflix_device_id';

function baseCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  deviceIdentifier: string,
  rememberMe = false
): void {
  const refreshDays = rememberMe
    ? Math.max(env.REFRESH_TOKEN_EXPIRES_DAYS, 30)
    : env.REFRESH_TOKEN_EXPIRES_DAYS;

  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieOptions(),
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions(),
    path: '/api/auth',
    maxAge: refreshDays * 24 * 60 * 60 * 1000,
  });

  res.cookie(DEVICE_COOKIE_NAME, deviceIdentifier, {
    ...baseCookieOptions(),
    path: '/',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...baseCookieOptions(), path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...baseCookieOptions(), path: '/api/auth' });
}
