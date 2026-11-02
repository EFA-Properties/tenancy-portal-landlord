interface Env {
  RESEND_API_KEY?: string
}

// Receives the Contact us form on the marketing website (www.tenancy-portal.co.uk)
// and emails it to hello@tenancy-portal.co.uk. It lives here because this
// Pages project already holds the Resend key; the website itself is static.

const allowedOrigins = [
  'https://www.tenancy-portal.co.uk',
  'https://tenancy-portal.co.uk',
]

function cors(origin: string | null) {
  const ok = origin && (allowedOrigins.includes(origin) || /^https:\/\/[a-z0-9-]+\.tenancy-portal-website\.pages\.dev$/.test(origin))
  return {
    'Access-Control-Allow-Origin': ok ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const roles: Record<string, string> = { landlord: 'Landlord', tenant: 'Tenant' }
const topics: Record<string, string> = {
  account: 'My account or signing in',
  billing: 'Billing and subscription',
  documents: 'Documents',
  other: 'Something else',
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = cors(context.request.headers.get('Origin'))
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

  const resendKey = context.env.RESEND_API_KEY
  if (!resendKey) return json({ error: 'Server configuration error' }, 500)

  let body: any
  try {
    body = await context.request.json()
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }

  // Spam trap: a hidden field people never see. Pretend success for bots.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true })

  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().slice(0, 200)
  const role = roles[String(body.role || '')]
  const topic = topics[String(body.topic || '')]
  const message = String(body.message || '').trim().slice(0, 5000)

  if (!name || !role || !topic || !message) return json({ error: 'Please fill in every field.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 580px; color: #302D2E;">
    <h2 style="margin: 0 0 16px;">New website enquiry</h2>
    <p style="margin: 0 0 6px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin: 0 0 6px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="margin: 0 0 6px;"><strong>They are a:</strong> ${role}</p>
    <p style="margin: 0 0 16px;"><strong>About:</strong> ${topic}</p>
    <div style="padding: 14px 16px; background: #F5F0E7; border-radius: 8px; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(message)}</div>
    <p style="font-size: 12px; color: #857e80; margin-top: 20px;">Sent from the Contact us page on tenancy-portal.co.uk. Reply to this email to answer them.</p>
  </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Tenancy Portal Website <noreply@tenancy-portal.co.uk>',
      to: ['hello@tenancy-portal.co.uk'],
      reply_to: email,
      subject: `Website enquiry (${role}): ${topic}`,
      html,
    }),
  })
  if (!res.ok) {
    console.error('Resend error:', await res.text())
    return json({ error: 'Sorry, your message could not be sent. Please email us instead.' }, 502)
  }
  return json({ ok: true })
}

export const onRequestOptions: PagesFunction<Env> = async (context) =>
  new Response(null, { headers: cors(context.request.headers.get('Origin')) })
