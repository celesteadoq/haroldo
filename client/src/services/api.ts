import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, HealthCheckResponse } from '../types/api';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export interface ApiStructuredError extends Error {
  statusCode?: number;
  code?: string;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

async function runTokenRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    const skipRefresh =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (status === 401 && originalRequest && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;
      try {
        await runTokenRefresh();
        return api(originalRequest);
      } catch {
        // Segue para rejeição estruturada
      }
    }

    const message =
      error.response?.data?.message || error.message || 'Erro de comunicação com a API.';
    const structuredError: ApiStructuredError = new Error(message);
    structuredError.statusCode = status;
    structuredError.code = error.response?.data?.details?.code;
    return Promise.reject(structuredError);
  }
);

export async function fetchHealthStatus(): Promise<HealthCheckResponse> {
  const { data } = await api.get<HealthCheckResponse>('/health');
  return data;
}
