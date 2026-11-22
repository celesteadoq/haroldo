export type UserRole = 'USER' | 'ADMIN';

export interface UserPlanSummary {
  id: string;
  name: string;
  price: number;
  maxDevices: number;
  offlineBookLimit: number;
  monthlyBookLimit: number | null;
  hasAds: boolean;
  hasOfflineReading: boolean;
}

export interface UserSubscriptionSummary {
  id: string;
  status: 'ACTIVE' | 'TRIALING' | 'PENDING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'SUSPENDED';
  isTrial: boolean;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  cancelAtPeriodEnd: boolean;
  plan: UserPlanSummary;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  trialEligible: boolean;
  preferredLanguage: string;
  preferredTheme: string;
  emailNotifications: boolean;
  createdAt: string;
  currentSubscription: UserSubscriptionSummary | null;
}

export interface ConnectedDevice {
  id: string;
  deviceName: string;
  firstAccessAt: string;
  lastActiveAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

export interface DevicesListResponse {
  maxDevices: number;
  devices: ConnectedDevice[];
}
