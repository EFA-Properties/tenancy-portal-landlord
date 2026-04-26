/**
 * GoCardless Webhook Handler — Supabase Edge Function
 *
 * SETUP:
 * 1. Deploy: supabase functions deploy gocardless-webhook
 * 2. Set secrets:
 *    supabase secrets set GC_ACCESS_TOKEN=your_token
 *    supabase secrets set GC_WEBHOOK_SECRET=your_webhook_secret
 * 3. Configure webhook in GoCardless dashboard:
 *    URL: https://fpgqqxaltegfjhqlhimk.supabase.co/functions/v1/gocardless-webhook
 *
 * Events handled:
 * - mandates.active → Activate billing, create subscription
 * - mandates.failed / cancelled → Deactivate billing
 * - payments.confirmed → Log payment
 * - payments.failed → Set grace period, notify landlord
 * - subscriptions.cancelled → Deactivate billing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const gcWebhookSecret = Deno.env.get('GC_WEBHOOK_SECRET')!
const gcAccessToken = Deno.env.get('GC_ACCESS_TOKEN')!

const GC_BASE = Deno.env.get('GC_ENVIRONMENT') === 'live'
  ? 'https://api.gocardless.com'
  : 'https://api-sandbox.gocardless.com'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Verify GoCardless webhook signature
function verifySignature(body: string, signature: string): boolean {
  const hmac = createHmac('sha256', gcWebhookSecret)
  hmac.update(body)
  const expectedSignature = hmac.digest('hex')
  return expectedSignature === signature
}

// Create a GoCardless subscription for monthly billing
async function createSubscription(mandateId: string, trialDays = 14): Promise<string> {
  // Calculate start date after trial period
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + trialDays)
  const startDateStr = startDate.toISOString().split('T')[0] // YYYY-MM-DD

  const response = await fetch(`${GC_BASE}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gcAccessToken}`,
      'GoCardless-Version': '2015-07-06',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptions: {
        amount: 2999, // £29.99 in pence
        currency: 'GBP',
        name: 'Tenancy Portal Pro',
        interval_unit: 'monthly',
        start_date: startDateStr,
        links: { mandate: mandateId },
        metadata: { product: 'tenancy-portal-pro' },
      },
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`GoCardless error: ${JSON.stringify(data)}`)
  }
  return data.subscriptions.id
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const signature = req.headers.get('Webhook-Signature') || ''

  // Verify webhook authenticity
  if (!verifySignature(body, signature)) {
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
        // Mandate is active — billing can start
        case 'mandates.active': {
          const mandateId = links.mandate
          // Find landlord by mandate ID
          const { data: landlord } = await supabase
            .from('landlords')
            .select('id')
            .eq('gc_mandate_id', mandateId)
            .single()

          if (landlord) {
            // Create subscription with 14-day trial
            const subscriptionId = await createSubscription(mandateId, 14)

            // Calculate trial end date
            const trialEnds = new Date()
            trialEnds.setDate(trialEnds.getDate() + 14)

            // Update landlord billing status
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
          // TODO: Log payment record, send receipt email
          break
        }

        // Payment failed — set grace period
        case 'payments.failed': {
          const mandateId = links.mandate
          const gracePeriod = new Date()
          gracePeriod.setDate(gracePeriod.getDate() + 7) // 7-day grace

          await supabase
            .from('landlords')
            .update({
              billing_grace_until: gracePeriod.toISOString(),
            })
            .eq('gc_mandate_id', mandateId)

          console.log(`Payment failed for mandate ${mandateId}, grace until ${gracePeriod.toISOString()}`)
          // TODO: Send failure email to landlord
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
})
