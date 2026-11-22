export interface HealthStatusResponse {
  status: 'ok' | 'degraded';
  service: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
}
