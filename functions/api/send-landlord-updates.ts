import { createClient } from '@supabase/supabase-js'

interface Env {
  RESEND_API_KEY?: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const propertyTypeLabels: Record<string, string> = {
  all: 'All lets',
  btl: 'Buy to Let',
  hmo: 'HMO',
  holiday_let: 'Holiday Let',
  commercial: 'Commercial',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// Emails landlords about published "What's Changing" updates that haven't been sent yet.
// Each update is claimed before sending, so calling this more than once never sends twice.
// A heads up is emailed once; the same update is emailed again only when it moves to
// 'action_needed'. Nothing is sent for an update until it has a published_at date.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const resendKey = context.env.RESEND_API_KEY
  if (!resendKey) return json({ error: 'Server configuration error' }, 500)

  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: pending, error } = await supabase
    .from('landlord_updates')
    .select('id, status, emailed_status')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
  if (error) return json({ error: 'Could not load updates' }, 500)

  const toSend = (pending || []).filter((u: any) => u.emailed_status !== u.status)
  if (!toSend.length) return json({ ok: true, updates: 0, sent: 0 })

  // Landlords and the property types they own
  const { data: landlords } = await supabase.from('landlords').select('id, full_name, email')
  const { data: properties } = await supabase.from('properties').select('landlord_id, property_type, is_hmo')
  const ownedTypes = new Map<string, Set<string>>()
  for (const p of (properties || []) as any[]) {
    if (!ownedTypes.has(p.landlord_id)) ownedTypes.set(p.landlord_id, new Set())
    if (p.property_type) ownedTypes.get(p.landlord_id)!.add(p.property_type)
    if (p.is_hmo) ownedTypes.get(p.landlord_id)!.add('hmo')
  }

  let updatesSent = 0
  let sent = 0
  for (const candidate of toSend) {
    // Claim the update so a second call can't email it again
    const { data: update } = await supabase
      .from('landlord_updates')
      .update({ emailed_status: candidate.status, emailed_at: new Date().toISOString() })
      .eq('id', candidate.id)
      .eq('status', candidate.status)
      .or(candidate.emailed_status ? `emailed_status.eq.${candidate.emailed_status}` : 'emailed_status.is.null')
      .select('*')
      .maybeSingle()
    if (!update) continue
    updatesSent++

    const appliesTo: string[] = update.applies_to || ['all']
    const recipients = ((landlords || []) as any[]).filter((l) => {
      if (!l.email) return false
      if (appliesTo.includes('all')) return true
      const owned = ownedTypes.get(l.id)
      return !!owned && appliesTo.some((t) => owned.has(t))
    })

    const actionNeeded = update.status === 'action_needed'
    const appliesLabel = appliesTo.map((t) => propertyTypeLabels[t] ?? t).join(', ')
    const subject = actionNeeded
      ? `Time to act: ${update.title}`
      : `Heads up, no action needed yet: ${update.title}`
    const intro = actionNeeded
      ? "We mentioned this change before, and it's now time to get it sorted for the properties it applies to."
      : "Just giving you a heads up about an upcoming change. There's nothing you need to do right now, and we'll let you know when it's time to act."
    let sourceLink = ''
    if (update.source_url) {
      let host = 'the official website'
      try { host = new URL(update.source_url).hostname.replace(/^www\./, '') } catch { /* keep default */ }
      sourceLink = `<p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        <a href="${escapeHtml(update.source_url)}" style="color: #0f766e;">View on ${escapeHtml(host)} (external site)</a>
      </p>`
    }

    for (const l of recipients) {
      const firstName = (l.full_name || '').split(' ')[0]
      const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 28px; color: #0f766e; margin: 0;">Tenancy Portal</h1>
      </div>
      <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Hi ${escapeHtml(firstName || 'there')},</h2>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">${intro}</p>
      <div style="padding: 16px 20px; background: #f0fdfa; border-radius: 8px; margin: 0 0 20px;">
        <p style="font-size: 16px; font-weight: 600; margin: 0 0 8px;">${escapeHtml(update.title)}</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px; white-space: pre-line;">${escapeHtml(update.summary)}</p>
        <p style="font-size: 13px; color: #475569; margin: 0;">
          Applies to: ${escapeHtml(appliesLabel)}${update.takes_effect ? `<br />Expected from: ${formatDate(update.takes_effect)}` : ''}
        </p>
      </div>
      ${sourceLink}
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://landlord.tenancy-portal.co.uk/whats-changing" style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none;">
          See What's Changing
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 32px;">
        This summary is general information from Tenancy Portal, not legal advice. You're receiving it because you have a
        Tenancy Portal landlord account. Questions? Just reply to this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
        Tenancy Portal is a commercial software product by P3 Technologies Ltd, registered in England and Wales
        (Company No. 17180916), 107a High Street, Carrville, Durham, DH1 1BQ. This is not a government website and we are not affiliated with any government body.<br />
        <a href="https://www.tenancy-portal.co.uk" style="color: #0f766e; text-decoration: none;">tenancy-portal.co.uk</a>
      </p>
    </div>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Tenancy Portal <noreply@tenancy-portal.co.uk>',
          reply_to: 'hello@tenancy-portal.co.uk',
          to: [l.email],
          subject,
          html,
        }),
      })
      if (res.ok) sent++
      else console.error('Resend error:', await res.text())
    }
  }

  return json({ ok: true, updates: updatesSent, sent })
}
