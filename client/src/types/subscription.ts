import type { UserPlanSummary, UserSubscriptionSummary } from './auth';

export interface PlanItem extends UserPlanSummary {
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistoryEntry {
  id: string;
  subscriptionId: string;
  action: string;
  notes: string | null;
  createdAt: string;
  fromPlan: { name: string } | null;
  toPlan: { name: string };
}

export interface SubscriptionUsageSummary {
  activeDevices: number;
  maxDevices: number;
  offlineBooks: number;
  offlineBookLimit: number;
}

export interface CurrentSubscriptionResponse {
  subscription: (UserSubscriptionSummary & { pendingPlan?: { id: string; name: string } | null }) | null;
  trialEligible: boolean;
  usage: SubscriptionUsageSummary;
  history: SubscriptionHistoryEntry[];
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELED';

export interface PaymentRecord {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  cardBrand: string | null;
  cardLast4: string | null;
  failureReason: string | null;
  transactionReference: string | null;
  createdAt: string;
  plan: { id: string; name: string } | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  category: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface HelpArticleItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
