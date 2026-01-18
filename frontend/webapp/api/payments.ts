import { apiClient } from '../lib/client';

export interface CreateCheckoutSessionRequest {
  plan: 'pro';
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export interface SubscriptionStatus {
  plan: 'basic' | 'pro';
  status: 'trialing' | 'active' | 'canceled' | 'past_due';
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface BillingPortalResponse {
  portal_url: string;
}

export const paymentsApi = {
  /**
   * Create a Stripe checkout session for upgrading to Pro
   */
  createCheckoutSession: async (data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
    const response = await apiClient.post<CheckoutSessionResponse>('/payments/create-checkout-session', data);
    return response.data;
  },

  /**
   * Get current subscription status
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get<SubscriptionStatus>('/payments/subscription-status');
    return response.data;
  },

  /**
   * Create a billing portal session for managing subscription
   */
  createBillingPortalSession: async (): Promise<BillingPortalResponse> => {
    const response = await apiClient.post<BillingPortalResponse>('/payments/billing-portal');
    return response.data;
  },

  /**
   * Cancel subscription (will remain active until period end)
   */
  cancelSubscription: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/payments/cancel-subscription');
    return response.data;
  },
};
