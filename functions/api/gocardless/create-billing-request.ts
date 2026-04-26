import { createClient } from '@supabase/supabase-js'

interface Env {
  GC_ACCESS_TOKEN: string
  GC_ENVIRONMENT: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GC_ACCESS_TOKEN, GC_ENVIRONMENT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env

  if (!GC_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing required environment variables' }),
      { status: 500, headers: corsHeaders }
    )
  }

  const GC_BASE = GC_ENVIRONMENT === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com'

  const GC_HEADERS = {
    'Authorization': `Bearer ${GC_ACCESS_TOKEN}`,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json',
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { landlordId, email, fullName, successUrl, exitUrl } = await context.request.json() as any

    if (!landlordId || !email || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: landlordId, email, fullName' }),
        { status: 400, headers: corsHeaders }
      )
    }

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
    const customerData: any = await customerRes.json()
    if (!customerRes.ok) throw new Error(JSON.stringify(customerData))
    const customerId = customerData.customers.id

    // 2. Create billing request (Bacs DD mandate)
    const billingReqRes = await fetch(`${GC_BASE}/billing_requests`, {
      method: 'POST',
      headers: GC_HEADERS,
      body: JSON.stringify({
        billing_requests: {
          mandate_request: { scheme: 'bacs', currency: 'GBP' },
          links: { customer: customerId },
          metadata: { landlord_id: landlordId },
        },
      }),
    })
    const billingReqData: any = await billingReqRes.json()
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
    const flowData: any = await flowRes.json()
    if (!flowRes.ok) throw new Error(JSON.stringify(flowData))

    const authorisationUrl = flowData.billing_request_flows.authorisation_url
    const mandateId = billingReqData.billing_requests?.links?.mandate_request_mandate

    // 4. Update landlord with GoCardless IDs and activate Pro trial
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    await supabase
      .from('landlords')
      .update({
        gc_customer_id: customerId,
        gc_mandate_id: mandateId || null,
        plan: 'pro',
        billing_active: true,
        trial_ends_at: trialEnds.toISOString(),
      })
      .eq('id', landlordId)

    return new Response(
      JSON.stringify({ authorisation_url: authorisationUrl }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('Error creating billing request:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders })
}
