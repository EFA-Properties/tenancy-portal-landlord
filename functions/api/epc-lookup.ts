interface Env {
  EPC_API_EMAIL?: string
  EPC_API_KEY?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const postcode = url.searchParams.get('postcode')

  if (!postcode) {
    return new Response(JSON.stringify({ error: 'postcode parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiEmail = context.env.EPC_API_EMAIL || ''
  const apiKey = context.env.EPC_API_KEY || ''

  if (!apiEmail || !apiKey) {
    return new Response(JSON.stringify({ error: 'EPC API credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const credentials = btoa(`${apiEmail}:${apiKey}`)

  try {
    const epcResponse = await fetch(
      `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}&size=100`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!epcResponse.ok) {
      const text = await epcResponse.text()
      return new Response(JSON.stringify({ error: `EPC API error: ${epcResponse.status}`, details: text }), {
        status: epcResponse.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await epcResponse.json()

    // Map to simplified format
    // Gov.uk certificate URLs use an RRN (Report Reference Number) that the EPC API does NOT provide.
    // Instead, we link to our own /api/epc-certificate endpoint which fetches full certificate data
    // from the EPC API and renders a professional HTML certificate page.
    const results = (data.rows || []).map((row: any) => {
      const lmkKey = row['lmk-key'] || null
      const address = row['address'] || ''
      return {
        address,
        postcode: row['postcode'],
        current_rating: row['current-energy-rating'],
        current_score: row['current-energy-efficiency'],
        lodgement_date: row['lodgement-date'],
        expiry_date: row['lodgement-date'] ? calculateExpiry(row['lodgement-date']) : null,
        property_type: row['property-type'],
        built_form: row['built-form'],
        floor_area: row['total-floor-area'],
        lmk_key: lmkKey,
        // In-portal EPC certificate viewer using our Cloudflare Function
        certificate_url: lmkKey
          ? `/api/epc-certificate?lmk_key=${encodeURIComponent(lmkKey)}&address=${encodeURIComponent(address)}`
          : null,
      }
    })

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch EPC data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function calculateExpiry(lodgementDate: string): string {
  const date = new Date(lodgementDate)
  date.setFullYear(date.getFullYear() + 10)
  return date.toISOString().split('T')[0]
}
