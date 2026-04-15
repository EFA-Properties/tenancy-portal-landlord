/**
 * GoCardless Integration — Scaffolded
 *
 * SETUP REQUIRED:
 * 1. Create a GoCardless account at https://manage.gocardless.com
 * 2. Get your Access Token from the Developers section
 * 3. Add VITE_GOCARDLESS_ACCESS_TOKEN to your .env.local
 * 4. For production: set up webhook endpoint (Supabase Edge Function)
 *
 * This file provides the client-side billing request flow.
 * GoCardless Billing Requests use a hosted page for bank auth —
 * we redirect the user there, they complete the mandate, and
 * GoCardless redirects back to our success URL.
 */

const GC_ENVIRONMENT = import.meta.env.VITE_GOCARDLESS_ENVIRONMENT || 'sandbox'
const GC_BASE_URL = GC_ENVIRONMENT === 'live'
  ? 'https://api.gocardless.com'
  : 'https://api-sandbox.gocardless.com'

/**
 * Create a GoCardless Billing Request Flow
 * This generates a hosted page URL where the landlord sets up their DD mandate.
 *
 * In production, this should be called from a Supabase Edge Function
 * (not client-side) to keep the access token secret.
 */
export async function createBillingRequestFlow(params: {
  landlordId: string
  email: string
  fullName: string
  successUrl: string
  exitUrl: string
}): Promise<{ authorisation_url: string }> {
  // TODO: Replace with actual Supabase Edge Function call
  // The edge function will:
  // 1. Create a GoCardless customer
  // 2. Create a billing request
  // 3. Create a billing request flow (hosted page)
  // 4. Return the authorisation_url

  // For now, this is a placeholder that would call your edge function:
  const response = await fetch('/api/gocardless/create-billing-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to create billing request')
  }

  return response.json()
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
