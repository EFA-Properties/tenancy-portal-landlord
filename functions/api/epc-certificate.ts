interface Env {
  EPC_API_EMAIL?: string
  EPC_API_KEY?: string
}

/**
 * Renders a full EPC certificate as a styled HTML page.
 * Fetches all certificate details from the EPC API using the lmk-key.
 *
 * Usage: /api/epc-certificate?lmk_key=abc123&address=107a+High+Street
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const lmkKey = url.searchParams.get('lmk_key')
  const addressHint = url.searchParams.get('address') || ''

  if (!lmkKey) {
    return new Response('Missing lmk_key parameter', { status: 400 })
  }

  const apiEmail = context.env.EPC_API_EMAIL || ''
  const apiKey = context.env.EPC_API_KEY || ''

  if (!apiEmail || !apiKey) {
    return new Response('EPC API credentials not configured', { status: 500 })
  }

  const credentials = btoa(`${apiEmail}:${apiKey}`)

  try {
    // Fetch full certificate details from the EPC API
    const epcResponse = await fetch(
      `https://epc.opendatacommunities.org/api/v1/domestic/certificate/${lmkKey}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!epcResponse.ok) {
      return new Response(`EPC API error: ${epcResponse.status}`, { status: 502 })
    }

    const data = await epcResponse.json()
    const cert = data.rows?.[0] || data

    // Extract all relevant fields
    const address = cert['address'] || addressHint || 'Unknown Property'
    const postcode = cert['postcode'] || ''
    const rating = cert['current-energy-rating'] || '?'
    const score = cert['current-energy-efficiency'] || ''
    const potentialRating = cert['potential-energy-rating'] || ''
    const potentialScore = cert['potential-energy-efficiency'] || ''
    const propertyType = cert['property-type'] || ''
    const builtForm = cert['built-form'] || ''
    const floorArea = cert['total-floor-area'] || ''
    const lodgementDate = cert['lodgement-date'] || ''
    const inspectionDate = cert['inspection-date'] || ''
    const expiryDate = lodgementDate ? calculateExpiry(lodgementDate) : ''
    const mainFuel = cert['main-fuel'] || cert['mainheat-description'] || ''
    const hotWater = cert['hot-water-description'] || cert['hotwater-description'] || ''
    const heating = cert['mainheat-description'] || ''
    const windows = cert['windows-description'] || ''
    const walls = cert['walls-description'] || ''
    const roof = cert['roof-description'] || ''
    const floor = cert['floor-description'] || ''
    const lighting = cert['lighting-description'] || ''
    const mainHeatingControls = cert['main-heating-controls'] || cert['mainheatcont-description'] || ''
    const co2Emissions = cert['co2-emissions-current'] || ''
    const co2Potential = cert['co2-emissions-potential'] || ''
    const energyConsumption = cert['energy-consumption-current'] || ''
    const energyConsumptionPotential = cert['energy-consumption-potential'] || ''
    const environmentImpact = cert['environment-impact-current'] || ''
    const environmentImpactPotential = cert['environment-impact-potential'] || ''

    // EPC rating colour
    const ratingColours: Record<string, string> = {
      'A': '#008054', 'B': '#19b459', 'C': '#8dce46',
      'D': '#ffd500', 'E': '#fcaa65', 'F': '#ef8023', 'G': '#e9153b',
    }
    const ratingColour = ratingColours[rating.toUpperCase()] || '#666'
    const potentialRatingColour = ratingColours[potentialRating.toUpperCase()] || '#666'

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EPC Certificate — ${address}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .header { background: #0f766e; color: white; padding: 32px 24px; border-radius: 16px 16px 0 0; }
    .header h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-bottom: 8px; }
    .header h2 { font-size: 22px; font-weight: 600; }
    .header p { font-size: 14px; opacity: 0.85; margin-top: 4px; }
    .card { background: white; border-radius: 0 0 16px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px; }
    .rating-row { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
    .rating-badge { width: 80px; height: 80px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; color: white; flex-shrink: 0; }
    .rating-info h3 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .rating-info p { color: #64748b; font-size: 14px; }
    .score-bar { display: flex; gap: 16px; margin: 24px 0; }
    .score-item { flex: 1; background: #f1f5f9; border-radius: 12px; padding: 16px; text-align: center; }
    .score-item .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px; }
    .score-item .value { font-size: 28px; font-weight: 700; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #0f766e; font-weight: 600; margin: 28px 0 16px 0; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail-item { padding: 12px 16px; background: #f8fafc; border-radius: 8px; }
    .detail-item .label { font-size: 12px; color: #94a3b8; margin-bottom: 2px; }
    .detail-item .value { font-size: 14px; font-weight: 500; }
    .full-width { grid-column: 1 / -1; }
    .footer { text-align: center; padding: 16px; color: #94a3b8; font-size: 12px; }
    .print-btn { display: inline-flex; align-items: center; gap: 6px; background: #0f766e; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; margin-bottom: 24px; }
    .print-btn:hover { background: #0d6660; }
    @media print { .print-btn { display: none; } .container { padding: 0; } body { background: white; } }
    @media (max-width: 600px) { .detail-grid { grid-template-columns: 1fr; } .rating-row { flex-direction: column; text-align: center; } }
  </style>
</head>
<body>
  <div class="container">
    <button class="print-btn" onclick="window.print()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
      Print Certificate
    </button>

    <div class="header">
      <h1>Energy Performance Certificate</h1>
      <h2>${escapeHtml(address)}</h2>
      <p>${escapeHtml(postcode)}</p>
    </div>

    <div class="card">
      <div class="rating-row">
        <div class="rating-badge" style="background:${ratingColour}">${escapeHtml(rating)}</div>
        <div class="rating-info">
          <h3>Current Rating: ${escapeHtml(rating)} (${escapeHtml(score)})</h3>
          <p>${potentialRating ? `Potential Rating: ${escapeHtml(potentialRating)} (${escapeHtml(potentialScore)})` : ''}</p>
        </div>
      </div>

      <div class="score-bar">
        <div class="score-item">
          <div class="label">Current Score</div>
          <div class="value" style="color:${ratingColour}">${escapeHtml(score)}</div>
        </div>
        <div class="score-item">
          <div class="label">Potential Score</div>
          <div class="value" style="color:${potentialRatingColour}">${escapeHtml(potentialScore || '—')}</div>
        </div>
        <div class="score-item">
          <div class="label">CO₂ (tonnes/yr)</div>
          <div class="value">${escapeHtml(co2Emissions || '—')}</div>
        </div>
      </div>

      <div class="section-title">Certificate Details</div>
      <div class="detail-grid">
        <div class="detail-item"><div class="label">Lodgement Date</div><div class="value">${formatDateStr(lodgementDate)}</div></div>
        <div class="detail-item"><div class="label">Valid Until</div><div class="value">${formatDateStr(expiryDate)}</div></div>
        <div class="detail-item"><div class="label">Property Type</div><div class="value">${escapeHtml(propertyType)}</div></div>
        <div class="detail-item"><div class="label">Built Form</div><div class="value">${escapeHtml(builtForm)}</div></div>
        <div class="detail-item"><div class="label">Floor Area</div><div class="value">${floorArea ? escapeHtml(floorArea) + ' m²' : '—'}</div></div>
        <div class="detail-item"><div class="label">Inspection Date</div><div class="value">${formatDateStr(inspectionDate)}</div></div>
      </div>

      <div class="section-title">Energy Use</div>
      <div class="detail-grid">
        <div class="detail-item"><div class="label">Energy Consumption (current)</div><div class="value">${energyConsumption ? escapeHtml(energyConsumption) + ' kWh/m²' : '—'}</div></div>
        <div class="detail-item"><div class="label">Energy Consumption (potential)</div><div class="value">${energyConsumptionPotential ? escapeHtml(energyConsumptionPotential) + ' kWh/m²' : '—'}</div></div>
        <div class="detail-item"><div class="label">CO₂ Emissions (current)</div><div class="value">${co2Emissions ? escapeHtml(co2Emissions) + ' tonnes/year' : '—'}</div></div>
        <div class="detail-item"><div class="label">CO₂ Emissions (potential)</div><div class="value">${co2Potential ? escapeHtml(co2Potential) + ' tonnes/year' : '—'}</div></div>
      </div>

      <div class="section-title">Property Features</div>
      <div class="detail-grid">
        <div class="detail-item full-width"><div class="label">Heating</div><div class="value">${escapeHtml(heating || '—')}</div></div>
        <div class="detail-item full-width"><div class="label">Heating Controls</div><div class="value">${escapeHtml(mainHeatingControls || '—')}</div></div>
        <div class="detail-item"><div class="label">Hot Water</div><div class="value">${escapeHtml(hotWater || '—')}</div></div>
        <div class="detail-item"><div class="label">Lighting</div><div class="value">${escapeHtml(lighting || '—')}</div></div>
        <div class="detail-item"><div class="label">Walls</div><div class="value">${escapeHtml(walls || '—')}</div></div>
        <div class="detail-item"><div class="label">Roof</div><div class="value">${escapeHtml(roof || '—')}</div></div>
        <div class="detail-item"><div class="label">Floor</div><div class="value">${escapeHtml(floor || '—')}</div></div>
        <div class="detail-item"><div class="label">Windows</div><div class="value">${escapeHtml(windows || '—')}</div></div>
      </div>
    </div>

    <div class="footer">
      <p>Data sourced from the Energy Performance of Buildings Register (England & Wales)</p>
      <p>Certificate reference: ${escapeHtml(lmkKey)}</p>
    </div>
  </div>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    return new Response('Failed to fetch EPC certificate data', { status: 500 })
  }
}

function calculateExpiry(lodgementDate: string): string {
  const date = new Date(lodgementDate)
  date.setFullYear(date.getFullYear() + 10)
  return date.toISOString().split('T')[0]
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateStr(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}
