import { api } from './api';
import type { AuthUser } from '../types/auth';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const { data } = await api.post<{ user: AuthUser }>('/auth/register', payload);
    return data.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const { data } = await api.post<{ user: AuthUser }>('/auth/login', payload);
    return data.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me');
    return data.user;
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data.message;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<string> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
    return data.message;
  },
};
