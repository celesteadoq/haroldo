import { env } from '../config/env';

export interface EmailProvider {
  sendPasswordReset(params: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<{ delivered: boolean }>;
}

class DevConsoleEmailProvider implements EmailProvider {
  async sendPasswordReset({
    to,
    resetUrl,
  }: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<{ delivered: boolean }> {
    if (env.NODE_ENV === 'development') {
      console.info(
        `[DEV EMAIL] Link de recuperação para ${to} (expira em 30 min): ${resetUrl}`
      );
    }
    return { delivered: false };
  }
}

class SmtpNotConfiguredFallbackProvider extends DevConsoleEmailProvider {}

export function createEmailService(): EmailProvider {
  if (!env.SMTP_HOST) {
    return new DevConsoleEmailProvider();
  }
  return new SmtpNotConfiguredFallbackProvider();
}

export const emailService = createEmailService();
