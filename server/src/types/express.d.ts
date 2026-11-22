import type { UserRole } from '@prisma/client';
import 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  deviceId: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
