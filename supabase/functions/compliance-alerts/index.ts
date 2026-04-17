/**
 * Compliance Alerts — Supabase Edge Function
 *
 * Runs daily (via cron) to check certificate expiry dates and send email alerts.
 * Pro-only feature.
 *
 * Alert schedule:
 * - 30 days before expiry
 * - 7 days before expiry
 * - Day of expiry
 * - Right to Rent repeat check overdue
 *
 * SETUP:
 * 1. Deploy: supabase functions deploy compliance-alerts
 * 2. Set secrets:
 *    supabase secrets set RESEND_API_KEY=your_key
 * 3. Create cron job in Supabase dashboard (Extensions > pg_cron):
 *    SELECT cron.schedule('compliance-alerts', '0 8 * * *',
 *      $$SELECT net.http_post(
 *        'https://fpgqqxaltegfjhqlhimk.supabase.co/functions/v1/compliance-alerts',
 *        '{}',
 *        'application/json',
 *        ARRAY[http_header('Authorization', 'Bearer ' || current_setting('supabase.service_role_key'))]
 *      )$$
 *    );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const FROM_EMAIL = 'Tenancy Portal <hello@tenancy-portal.co.uk>'

interface ExpiryAlert {
  landlord_id: string
  landlord_email: string
  landlord_name: string
  property_address: string
  property_id: string
  cert_type: string
  cert_label: string
  expiry_date: string
  days_until: number
}

// Send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.log(`[DRY RUN] Would send to ${to}: ${subject}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`Resend error: ${err}`)
    throw new Error(`Failed to send email: ${err}`)
  }
}

// Build alert email HTML
function buildAlertEmail(alerts: ExpiryAlert[]): string {
  const rows = alerts.map((a) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e6ec;">${a.cert_label}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e6ec;">${a.property_address}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e6ec;">${a.expiry_date}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e6ec; font-weight: 600; color: ${a.days_until <= 0 ? '#b91c1c' : a.days_until <= 7 ? '#b45309' : '#0f766e'};">
        ${a.days_until <= 0 ? 'EXPIRED' : a.days_until === 1 ? 'Tomorrow' : `${a.days_until} days`}
      </td>
    </tr>
  `).join('')

  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="height: 3px; background-color: #0f766e;"></div>
      <div style="padding: 24px;">
        <h1 style="font-size: 20px; font-weight: 600; color: #141820; margin-bottom: 8px;">
          Compliance Alert
        </h1>
        <p style="font-size: 14px; color: #4a5268; margin-bottom: 24px;">
          The following certificates require your attention:
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #141820;">
          <thead>
            <tr style="background-color: #f0f2f5;">
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a90a0;">Certificate</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a90a0;">Property</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a90a0;">Expiry</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a90a0;">Remaining</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="https://landlord.tenancy-portal.co.uk/compliance"
             style="display: inline-block; padding: 12px 24px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            View in Portal
          </a>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #8a90a0; text-align: center;">
          Tenancy Portal — Document compliance for self-managing landlords
        </p>
      </div>
    </div>
  `
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Calculate target dates
    const in30 = new Date(today)
    in30.setDate(in30.getDate() + 30)
    const in7 = new Date(today)
    in7.setDate(in7.getDate() + 7)

    const targetDates = [
      { date: todayStr, days: 0, label: 'today' },
      { date: in7.toISOString().split('T')[0], days: 7, label: '7 days' },
      { date: in30.toISOString().split('T')[0], days: 30, label: '30 days' },
    ]

    // Get all Pro landlords with their properties
    const { data: landlords, error: lErr } = await supabase
      .from('landlords')
      .select('id, email, full_name')
      .or('plan.eq.pro,comped.eq.true')
      .eq('billing_active', true)

    if (lErr) throw lErr
    if (!landlords || landlords.length === 0) {
      return new Response(JSON.stringify({ message: 'No Pro landlords', alerts_sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let totalAlertsSent = 0

    for (const landlord of landlords) {
      const alerts: ExpiryAlert[] = []

      // Check property-level expiries: gas_safety_expiry, epc_expiry, eicr_expiry
      const { data: properties } = await supabase
        .from('properties')
        .select('id, address_line1, town, gas_safety_expiry, epc_expiry, eicr_expiry')
        .eq('landlord_id', landlord.id)

      if (properties) {
        for (const prop of properties) {
          const address = `${prop.address_line1}, ${prop.town}`
          const certs = [
            { field: 'gas_safety_expiry', label: 'Gas Safety Certificate (CP12)', value: prop.gas_safety_expiry },
            { field: 'epc_expiry', label: 'EPC Certificate', value: prop.epc_expiry },
            { field: 'eicr_expiry', label: 'EICR (Electrical Safety)', value: prop.eicr_expiry },
          ]

          for (const cert of certs) {
            if (!cert.value) continue
            for (const target of targetDates) {
              if (cert.value === target.date) {
                // Check if we already sent this alert
                const { data: existing } = await supabase
                  .from('compliance_alerts')
                  .select('id')
                  .eq('landlord_id', landlord.id)
                  .eq('property_id', prop.id)
                  .eq('document_type', cert.field)
                  .eq('days_before', target.days)
                  .not('sent_at', 'is', null)
                  .limit(1)

                if (!existing || existing.length === 0) {
                  alerts.push({
                    landlord_id: landlord.id,
                    landlord_email: landlord.email,
                    landlord_name: landlord.full_name,
                    property_address: address,
                    property_id: prop.id,
                    cert_type: cert.field,
                    cert_label: cert.label,
                    expiry_date: cert.value,
                    days_until: target.days,
                  })
                }
              }
            }
          }
        }
      }

      // Check Right to Rent overdue checks
      const { data: rtrChecks } = await supabase
        .from('right_to_rent_checks')
        .select('id, tenant_id, tenancy_id, next_check_due, tenancies(property_id, properties(address_line1, town))')
        .eq('landlord_id', landlord.id)
        .not('next_check_due', 'is', null)
        .lte('next_check_due', todayStr)

      if (rtrChecks) {
        for (const check of rtrChecks as any[]) {
          const address = check.tenancies?.properties
            ? `${check.tenancies.properties.address_line1}, ${check.tenancies.properties.town}`
            : 'Unknown property'

          alerts.push({
            landlord_id: landlord.id,
            landlord_email: landlord.email,
            landlord_name: landlord.full_name,
            property_address: address,
            property_id: check.tenancies?.property_id || '',
            cert_type: 'right_to_rent_check',
            cert_label: 'Right to Rent — Repeat Check Due',
            expiry_date: check.next_check_due,
            days_until: 0,
          })
        }
      }

      // Send grouped email if there are alerts
      if (alerts.length > 0) {
        const subject = alerts.some(a => a.days_until <= 0)
          ? `Action required: Compliance certificates expiring`
          : alerts.some(a => a.days_until <= 7)
            ? `Reminder: Certificates expiring within 7 days`
            : `Upcoming: Certificates expiring within 30 days`

        await sendEmail(landlord.email, subject, buildAlertEmail(alerts))

        // Record sent alerts
        for (const alert of alerts) {
          await supabase.from('compliance_alerts').upsert({
            landlord_id: alert.landlord_id,
            property_id: alert.property_id || null,
            alert_type: 'expiry',
            document_type: alert.cert_type,
            expiry_date: alert.expiry_date,
            days_before: alert.days_until,
            sent_at: new Date().toISOString(),
          }, {
            onConflict: 'landlord_id,property_id,tenancy_id,alert_type,document_type,days_before',
          })
        }

        totalAlertsSent += alerts.length
        console.log(`Sent ${alerts.length} alerts to ${landlord.email}`)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Compliance check complete', alerts_sent: totalAlertsSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Compliance alerts error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
