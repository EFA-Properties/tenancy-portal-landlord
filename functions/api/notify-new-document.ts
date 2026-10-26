import { createClient } from '@supabase/supabase-js'

interface Env {
  RESEND_API_KEY?: string
  TENANT_PORTAL_URL?: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const docTypeLabels: Record<string, string> = {
  ast: 'Assured Periodic Tenancy Agreement / Written Statement of Terms',
  epc: 'EPC Certificate',
  gas_safety: 'Gas Safety Certificate (CP12)',
  eicr: 'EICR (Electrical Safety)',
  inventory: 'Inventory and Schedule of Condition',
  deposit_certificate: 'Deposit Protection Certificate',
  how_to_rent: 'How to Rent Guide',
  renter_rights: "Renter's Rights",
  right_to_rent: 'Right to Rent Check',
  hmo_licence: 'HMO Licence',
  emergency_lighting: 'Emergency Lighting Report',
  fire_risk_assessment: 'Fire Risk Assessment',
  fire_emergency_procedures: 'Fire and Emergency Procedures',
  house_rules: 'House Rules / Guidance',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://landlord.tenancy-portal.co.uk',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

// Emails each registered tenant on the document's tenancy (or the property's
// current tenancies) that a new document is waiting for them in the portal.
// The email only links to the portal; the document itself is never attached.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const resendKey = context.env.RESEND_API_KEY
  if (!resendKey) return json({ error: 'Server configuration error' }, 500)

  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)

  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!user) return json({ error: 'Invalid or expired token' }, 401)

  let documentId: string | undefined
  try {
    documentId = (await context.request.json() as any).documentId
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!documentId) return json({ error: 'documentId is required' }, 400)

  const { data: landlord } = await supabase
    .from('landlords').select('id, full_name').eq('auth_user_id', user.id).single()
  if (!landlord) return json({ error: 'Landlord not found' }, 403)

  const { data: doc } = await supabase
    .from('documents')
    .select('id, landlord_id, scope, property_id, tenancy_id, document_type, title, tenant_visible')
    .eq('id', documentId).single()
  if (!doc || doc.landlord_id !== landlord.id) return json({ error: 'Document not found' }, 404)
  if (doc.tenant_visible === false || doc.document_type === 'right_to_rent') return json({ ok: true, sent: 0 })

  // Which tenancies can see this document
  let tenancyIds: string[] = []
  if (doc.scope === 'tenancy' && doc.tenancy_id) {
    tenancyIds = [doc.tenancy_id]
  } else if (doc.property_id) {
    const { data: tenancies } = await supabase
      .from('tenancies').select('id').eq('property_id', doc.property_id).eq('status', 'active')
    tenancyIds = (tenancies || []).map((t: { id: string }) => t.id)
  }
  if (!tenancyIds.length) return json({ ok: true, sent: 0 })

  const { data: links } = await supabase
    .from('tenancy_tenants')
    .select('tenancy_id, status, tenants(full_name, email, auth_user_id), tenancies(properties(address_line1, town))')
    .in('tenancy_id', tenancyIds)

  const recipients = new Map<string, { name: string; address: string }>()
  for (const link of (links || []) as any[]) {
    const tenant = link.tenants
    if (link.status && link.status !== 'active') continue
    if (!tenant?.email || !tenant.auth_user_id) continue // only tenants who have registered
    const p = link.tenancies?.properties
    recipients.set(tenant.email.toLowerCase(), {
      name: tenant.full_name || '',
      address: [p?.address_line1, p?.town].filter(Boolean).join(', '),
    })
  }

  const portalUrl = context.env.TENANT_PORTAL_URL || 'https://portal.tenancy-portal.co.uk'
  const homeLink = `${portalUrl}/home`
  const documentName = doc.title || docTypeLabels[doc.document_type] || 'a document'
  const landlordName = landlord.full_name || 'Your landlord'

  let sent = 0
  for (const [email, r] of recipients) {
    const firstName = r.name.split(' ')[0]
    const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 28px; color: #0f766e; margin: 0;">Tenancy Portal</h1>
      </div>
      <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Hi ${escapeHtml(firstName || 'there')},</h2>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px;">
        <strong>${escapeHtml(landlordName)}</strong> has added a new document for you in the Tenancy Portal${r.address ? ` for <strong>${escapeHtml(r.address)}</strong>` : ''}:
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; padding: 12px 16px; background: #f0fdfa; border-radius: 8px;">
        ${escapeHtml(documentName)}
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        You can read it and confirm you have received it when you next sign in.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${homeLink}" style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none;">
          Open the Tenancy Portal
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 32px;">
        For your security this email does not include the document. If you were not expecting this email, you can ignore it.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
        Tenancy Portal is a commercial software product by P3 Technologies Ltd, registered in England and Wales
        (Company No. 17180916), 107a High Street, Carrville, Durham, DH1 1BQ. Not affiliated with any government body.<br />
        <a href="https://www.tenancy-portal.co.uk" style="color: #0f766e; text-decoration: none;">tenancy-portal.co.uk</a>
      </p>
    </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Tenancy Portal <noreply@tenancy-portal.co.uk>',
        reply_to: 'hello@tenancy-portal.co.uk',
        to: [email],
        subject: `New document from ${landlordName}: ${documentName}`,
        html,
      }),
    })
    if (res.ok) sent++
    else console.error('Resend error:', await res.text())
  }

  return json({ ok: true, sent })
}

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { headers: corsHeaders })
