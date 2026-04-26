import { createClient } from '@supabase/supabase-js'

interface Env {
  GC_ACCESS_TOKEN: string
  GC_ENVIRONMENT: string
  GC_WEBHOOK_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

/**
 * GoCardless Webhook Handler — Cloudflare Pages Function
 *
 * Webhook URL to configure in GoCardless dashboard:
 *   https://landlord.tenancy-portal.co.uk/api/gocardless/webhook
 *
 * Events handled:
 * - mandates.active → Create subscription with 14-day trial, activate billing
 * - mandates.failed / cancelled → Deactivate billing
 * - payments.confirmed → Log payment
 * - payments.failed → Set 7-day grace period
 * - subscriptions.cancelled → Deactivate billing
 */

// Verify GoCardless webhook signature using Web Crypto API
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return expectedHex === signature
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GC_ACCESS_TOKEN, GC_ENVIRONMENT, GC_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env

  if (!GC_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    return new Response('Server misconfigured', { status: 500 })
  }

  const GC_BASE = GC_ENVIRONMENT === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com'

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const body = await context.request.text()
  const signature = context.request.headers.get('Webhook-Signature') || ''

  // Verify webhook authenticity
  const valid = await verifySignature(body, signature, GC_WEBHOOK_SECRET)
  if (!valid) {
    console.error('Invalid webhook signature')
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(body)
  const events = payload.events || []

  for (const event of events) {
    const { resource_type, action, links } = event
    console.log(`Processing event: ${resource_type}.${action}`)

    try {
      switch (`${resource_type}.${action}`) {
        // Mandate is active — create subscription and activate billing
        case 'mandates.active': {
          const mandateId = links.mandate
          const { data: landlord } = await supabase
            .from('landlords')
            .select('id, plan_price')
            .eq('gc_mandate_id', mandateId)
            .single()

          if (landlord) {
            // Use the landlord's plan_price (set at registration with promo code)
            // Default to £29.99 if not set; convert pounds to pence for GoCardless
            const priceInPounds = landlord.plan_price ?? 29.99
            const amountInPence = Math.round(priceInPounds * 100)

            // Create subscription with 14-day trial (first payment deferred)
            const startDate = new Date()
            startDate.setDate(startDate.getDate() + 14)
            const startDateStr = startDate.toISOString().split('T')[0]

            const subRes = await fetch(`${GC_BASE}/subscriptions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GC_ACCESS_TOKEN}`,
                'GoCardless-Version': '2015-07-06',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subscriptions: {
                  amount: amountInPence,
                  currency: 'GBP',
                  name: 'Tenancy Portal Pro',
                  interval_unit: 'monthly',
                  start_date: startDateStr,
                  links: { mandate: mandateId },
                  metadata: { product: 'tenancy-portal-pro', price: `£${priceInPounds}` },
                },
              }),
            })
            const subData: any = await subRes.json()
            if (!subRes.ok) throw new Error(`GoCardless error: ${JSON.stringify(subData)}`)
            const subscriptionId = subData.subscriptions.id

            const trialEnds = new Date()
            trialEnds.setDate(trialEnds.getDate() + 14)

            await supabase
              .from('landlords')
              .update({
                billing_active: true,
                plan: 'pro',
                gc_subscription_id: subscriptionId,
                trial_ends_at: trialEnds.toISOString(),
                billing_grace_until: null,
              })
              .eq('id', landlord.id)

            console.log(`Activated billing for landlord ${landlord.id}`)
          }
          break
        }

        // Mandate failed or cancelled
        case 'mandates.failed':
        case 'mandates.cancelled': {
          const mandateId = links.mandate
          await supabase
            .from('landlords')
            .update({
              billing_active: false,
              gc_mandate_id: null,
              gc_subscription_id: null,
            })
            .eq('gc_mandate_id', mandateId)
          console.log(`Deactivated billing for mandate ${mandateId}`)
          break
        }

        // Payment confirmed
        case 'payments.confirmed': {
          console.log(`Payment confirmed: ${links.payment}`)
          break
        }

        // Payment failed — set grace period
        case 'payments.failed': {
          const mandateId = links.mandate
          const gracePeriod = new Date()
          gracePeriod.setDate(gracePeriod.getDate() + 7)

          await supabase
            .from('landlords')
            .update({ billing_grace_until: gracePeriod.toISOString() })
            .eq('gc_mandate_id', mandateId)
          console.log(`Payment failed for mandate ${mandateId}, grace until ${gracePeriod.toISOString()}`)
          break
        }

        // Subscription cancelled
        case 'subscriptions.cancelled': {
          const subscriptionId = links.subscription
          await supabase
            .from('landlords')
            .update({
              billing_active: false,
              gc_subscription_id: null,
            })
            .eq('gc_subscription_id', subscriptionId)
          console.log(`Subscription cancelled: ${subscriptionId}`)
          break
        }

        default:
          console.log(`Unhandled event: ${resource_type}.${action}`)
      }
    } catch (err) {
      console.error(`Error processing event ${resource_type}.${action}:`, err)
    }
  }

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
