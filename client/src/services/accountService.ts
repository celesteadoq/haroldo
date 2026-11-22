import { api } from './api';
import type { AuthUser, DevicesListResponse } from '../types/auth';

export interface UpdateProfilePayload {
  name?: string;
  preferredLanguage?: 'pt-BR' | 'en-US';
  preferredTheme?: 'dark' | 'sepia';
  emailNotifications?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const accountService = {
  async getProfile(): Promise<AuthUser> {
    const { data } = await api.get<{ user: AuthUser }>('/account/profile');
    return data.user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const { data } = await api.patch<{ user: AuthUser }>('/account/profile', payload);
    return data.user;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.patch('/account/password', payload);
  },

  async listDevices(): Promise<DevicesListResponse> {
    const { data } = await api.get<DevicesListResponse>('/account/devices');
    return data;
  },

  async disconnectDevice(id: string): Promise<{ disconnectedCurrentDevice: boolean }> {
    const { data } = await api.delete<{ disconnectedCurrentDevice: boolean }>(
      `/account/devices/${id}`
    );
    return data;
  },
};
