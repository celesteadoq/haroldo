export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  service: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  details?: {
    code?: string;
    [key: string]: unknown;
  };
}
