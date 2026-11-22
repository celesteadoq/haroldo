import { api } from './api';
import type { UserSubscriptionSummary } from '../types/auth';
import type {
  CurrentSubscriptionResponse,
  PaymentRecord,
  PlanItem,
} from '../types/subscription';

export interface SimulateCheckoutPayload {
  planId: string;
  cardHolderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  acceptedTerms: true;
  idempotencyKey?: string;
}

export const subscriptionService = {
  async listPlans(): Promise<PlanItem[]> {
    const { data } = await api.get<{ items: PlanItem[] }>('/plans');
    return data.items;
  },

  async getPlanById(planId: string): Promise<PlanItem> {
    const { data } = await api.get<{ plan: PlanItem }>(`/plans/${planId}`);
    return data.plan;
  },

  async getCurrentSubscription(): Promise<CurrentSubscriptionResponse> {
    const { data } = await api.get<CurrentSubscriptionResponse>('/subscriptions/current');
    return data;
  },

  async startTrial(): Promise<UserSubscriptionSummary> {
    const { data } = await api.post<{ subscription: UserSubscriptionSummary }>(
      '/subscriptions/trial'
    );
    return data.subscription;
  },

  async changePlan(targetPlanId: string): Promise<{
    nextAction: 'CANCEL_CURRENT' | 'OFFER_TRIAL' | 'CHECKOUT' | 'DOWNGRADE_SCHEDULED';
    plan?: PlanItem;
    message: string;
  }> {
    const { data } = await api.patch<{
      nextAction: 'CANCEL_CURRENT' | 'OFFER_TRIAL' | 'CHECKOUT' | 'DOWNGRADE_SCHEDULED';
      plan?: PlanItem;
      message: string;
    }>('/subscriptions/change-plan', { targetPlanId });
    return data;
  },

  async cancelSubscription(): Promise<UserSubscriptionSummary> {
    const { data } = await api.post<{ subscription: UserSubscriptionSummary }>(
      '/subscriptions/cancel'
    );
    return data.subscription;
  },

  async simulateCheckout(payload: SimulateCheckoutPayload): Promise<{
    approved: boolean;
    subscription: UserSubscriptionSummary;
    payment: PaymentRecord;
  }> {
    const { data } = await api.post<{
      approved: boolean;
      subscription: UserSubscriptionSummary;
      payment: PaymentRecord;
    }>('/payments/simulate', payload, {
      headers: payload.idempotencyKey ? { 'idempotency-key': payload.idempotencyKey } : undefined,
    });
    return data;
  },

  async listPayments(): Promise<PaymentRecord[]> {
    const { data } = await api.get<{ items: PaymentRecord[] }>('/payments');
    return data.items;
  },

  async getPaymentById(id: string): Promise<PaymentRecord> {
    const { data } = await api.get<{ payment: PaymentRecord }>(`/payments/${id}`);
    return data.payment;
  },
};
