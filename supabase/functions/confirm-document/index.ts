/**
 * Confirm Document - Supabase Edge Function
 *
 * Called by the tenant portal when a tenant taps "I have received and read this".
 * Records the confirmation (time comes from the database, not the phone), then
 * makes a stamped and signed PDF copy of the document and stores it in the
 * private "document-receipts" bucket at {tenancy_id}/{tenant_id}/{document_id}.pdf.
 *
 * Deploy: supabase functions deploy confirm-document
 */

import { createClient } from '@supabase/supabase-js'
import { buildSignedCopy } from './stamp.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  other: 'Other Document',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'Not signed in' }, 401)

  let documentId: string
  try {
    documentId = (await req.json()).document_id
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }
  if (!documentId) return json({ error: 'Missing document_id' }, 400)

  const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 500)
  const ipAddress = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()

  // Records the confirmation as the tenant, so the database checks they may see this document
  const { data: allowed, error: rpcError } = await userClient.rpc('tenant_record_document', {
    p_document_id: documentId,
    p_action: 'confirmed',
    p_user_agent: userAgent,
  })
  if (rpcError) return json({ error: rpcError.message }, 500)
  if (!allowed) return json({ error: 'Document not available' }, 403)

  const { data: tenant } = await admin
    .from('tenants').select('id, full_name, email').eq('auth_user_id', user.id).single()
  if (!tenant) return json({ error: 'Tenant not found' }, 404)

  const { data: ack } = await admin
    .from('document_acknowledgements')
    .select('id, tenancy_id, confirmed_at, confirmation_text, receipt_file_path')
    .eq('document_id', documentId).eq('tenant_id', tenant.id).single()
  if (!ack?.confirmed_at) return json({ error: 'Confirmation not recorded' }, 500)
  if (ack.receipt_file_path) return json({ ok: true, receipt_path: ack.receipt_file_path })

  const { data: doc } = await admin
    .from('documents')
    .select('id, scope, document_type, title, file_path, file_name, mime_type')
    .eq('id', documentId).single()
  if (!doc) return json({ error: 'Document not found' }, 404)

  const { data: tenancy } = await admin
    .from('tenancies')
    .select('id, landlords(full_name), properties(address_line1, address_line2, town, postcode)')
    .eq('id', ack.tenancy_id).single()
  const property = (tenancy as any)?.properties
  const landlord = (tenancy as any)?.landlords

  // Fetch the exact file the tenant was shown
  let original: Uint8Array | null = null
  if (doc.file_path?.startsWith('http')) {
    const res = await fetch(doc.file_path)
    if (res.ok) original = new Uint8Array(await res.arrayBuffer())
  } else if (doc.file_path) {
    const bucket = doc.scope === 'property' ? 'property-documents' : 'tenancy-documents'
    const { data: file } = await admin.storage.from(bucket).download(doc.file_path)
    if (file) original = new Uint8Array(await file.arrayBuffer())
  }

  const originalSha256 = original ? await sha256(original) : 'Original file could not be read'
  const reference = ack.id.slice(0, 8).toUpperCase()

  const signedCopy = await buildSignedCopy(original, doc.mime_type, {
    documentTitle: doc.title || docTypeLabels[doc.document_type] || doc.file_name || 'Document',
    fileName: doc.file_name || doc.file_path || '',
    propertyAddress: [property?.address_line1, property?.address_line2, property?.town, property?.postcode].filter(Boolean).join(', '),
    tenantName: tenant.full_name || tenant.email,
    tenantEmail: tenant.email || '',
    landlordName: landlord?.full_name || '',
    confirmedAt: new Date(ack.confirmed_at),
    ipAddress,
    userAgent,
    originalSha256,
    reference,
    confirmationText: ack.confirmation_text || 'I confirm I have received and read this document.',
  })

  const receiptPath = `${ack.tenancy_id}/${tenant.id}/${documentId}.pdf`
  const { error: uploadError } = await admin.storage
    .from('document-receipts')
    .upload(receiptPath, signedCopy, { contentType: 'application/pdf', upsert: true })
  if (uploadError) return json({ error: uploadError.message }, 500)

  const { error: updateError } = await admin
    .from('document_acknowledgements')
    .update({
      signed_name: tenant.full_name,
      original_sha256: original ? originalSha256 : null,
      receipt_file_path: receiptPath,
      receipt_sha256: await sha256(signedCopy),
      ip_address: ipAddress || null,
    })
    .eq('id', ack.id)
  if (updateError) return json({ error: updateError.message }, 500)

  return json({ ok: true, receipt_path: receiptPath })
})
