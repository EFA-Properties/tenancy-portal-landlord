/**
 * GoCardless Create Billing Request — Supabase Edge Function
 *
 * Called by the frontend when a Pro landlord needs to set up DD.
 * Creates a customer, billing request, and returns the hosted flow URL.
 *
 * SETUP:
 * 1. Deploy: supabase functions deploy gocardless-create-billing-request
 * 2. Set secrets:
 *    supabase secrets set GC_ACCESS_TOKEN=your_token
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const gcAccessToken = Deno.env.get('GC_ACCESS_TOKEN')!

const GC_BASE = Deno.env.get('GC_ENVIRONMENT') === 'live'
  ? 'https://api.gocardless.com'
  : 'https://api-sandbox.gocardless.com'

const GC_HEADERS = {
  'Authorization': `Bearer ${gcAccessToken}`,
  'GoCardless-Version': '2015-07-06',
  'Content-Type': 'application/json',
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { landlordId, email, fullName, successUrl, exitUrl } = await req.json()

    // 1. Create GoCardless customer
    const customerRes = await fetch(`${GC_BASE}/customers`, {
      method: 'POST',
      headers: GC_HEADERS,
      body: JSON.stringify({
        customers: {
          email,
          given_name: fullName.split(' ')[0],
          family_name: fullName.split(' ').slice(1).join(' ') || fullName,
          metadata: { landlord_id: landlordId },
        },
      }),
    })
    const customerData = await customerRes.json()
    if (!customerRes.ok) throw new Error(JSON.stringify(customerData))
    const customerId = customerData.customers.id

    // 2. Create billing request
    const billingReqRes = await fetch(`${GC_BASE}/billing_requests`, {
      method: 'POST',
      headers: GC_HEADERS,
      body: JSON.stringify({
        billing_requests: {
          mandate_request: {
            scheme: 'bacs',
            currency: 'GBP',
          },
          links: { customer: customerId },
          metadata: { landlord_id: landlordId },
        },
      }),
    })
    const billingReqData = await billingReqRes.json()
    if (!billingReqRes.ok) throw new Error(JSON.stringify(billingReqData))
    const billingRequestId = billingReqData.billing_requests.id

    // 3. Create billing request flow (hosted page)
    const flowRes = await fetch(`${GC_BASE}/billing_request_flows`, {
      method: 'POST',
      headers: GC_HEADERS,
      body: JSON.stringify({
        billing_request_flows: {
          redirect_uri: successUrl,
          exit_uri: exitUrl,
          links: { billing_request: billingRequestId },
          show_redirect_buttons: true,
          show_success_redirect_button: true,
        },
      }),
    })
    const flowData = await flowRes.json()
    if (!flowRes.ok) throw new Error(JSON.stringify(flowData))

    const authorisationUrl = flowData.billing_request_flows.authorisation_url
    const mandateId = billingReqData.billing_requests?.links?.mandate_request_mandate

    // 4. Update landlord with GoCardless IDs
    await supabase
      .from('landlords')
      .update({
        gc_customer_id: customerId,
        gc_mandate_id: mandateId || null,
      })
      .eq('id', landlordId)

    return new Response(
      JSON.stringify({ authorisation_url: authorisationUrl }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('Error creating billing request:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
