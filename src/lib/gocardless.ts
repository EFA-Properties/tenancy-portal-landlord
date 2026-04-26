/**
 * GoCardless Integration — LIVE
 *
 * Uses Cloudflare Pages Function to create billing requests securely.
 * The access token is stored as a Cloudflare env var, never exposed client-side.
 */

/**
 * Create a GoCardless Billing Request Flow via Pages Function.
 * Returns a hosted page URL where the landlord sets up their DD mandate.
 */
export async function createBillingRequestFlow(params: {
  landlordId: string
  email: string
  fullName: string
  successUrl: string
  exitUrl: string
}): Promise<{ authorisation_url: string }> {
  const response = await fetch('/api/gocardless/create-billing-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error((errorData as any).error || 'Failed to create billing request')
  }

  const data = await response.json() as { authorisation_url: string }

  if (!data.authorisation_url) {
    throw new Error('No authorisation URL returned from GoCardless')
  }

  return data
}

/**
 * GoCardless Webhook Event Types we handle
 */
export const GC_WEBHOOK_EVENTS = {
  MANDATE_CREATED: 'mandates.created',
  MANDATE_ACTIVE: 'mandates.active',
  MANDATE_FAILED: 'mandates.failed',
  MANDATE_CANCELLED: 'mandates.cancelled',
  PAYMENT_CONFIRMED: 'payments.confirmed',
  PAYMENT_FAILED: 'payments.failed',
  PAYMENT_PAID_OUT: 'payments.paid_out',
  SUBSCRIPTION_CREATED: 'subscriptions.created',
  SUBSCRIPTION_CANCELLED: 'subscriptions.cancelled',
} as const

/**
 * Plan configuration
 */
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Perfect for single BTL properties',
    features: [
      'Tenant portal access',
      'Compliance date logging',
      'Maintenance request logging',
      'Timestamped acknowledgement trail',
    ],
    limitations: [
      'No document upload or delivery',
      'No compliance alerts',
      'No audit report download',
      'No HMO features',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    description: 'Full feature set for all property types',
    features: [
      'Everything in Free',
      'Document upload & delivery to tenants',
      'Compliance alerts & expiry reminders',
      'Full audit report download',
      'HMO licence tracking & room portals',
      'Deposit tracking',
      'Priority support',
    ],
    limitations: [],
  },
} as const
