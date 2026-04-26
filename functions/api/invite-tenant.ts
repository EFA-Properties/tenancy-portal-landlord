interface Env {
  RESEND_API_KEY?: string
  TENANT_PORTAL_URL?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const resendKey = context.env.RESEND_API_KEY
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  let body: any
  try {
    body = await context.request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  const { tenantName, tenantEmail, landlordName, propertyAddress, inviteToken } = body

  if (!tenantName || !tenantEmail || !inviteToken) {
    return new Response(JSON.stringify({ error: 'tenantName, tenantEmail, and inviteToken are required' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  const portalUrl = context.env.TENANT_PORTAL_URL || 'https://tenant.tenancy-portal.co.uk'
  const inviteLink = `${portalUrl}/register?invite=${inviteToken}`

  const emailHtml = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 28px; color: #0f766e; margin: 0;">
          Tenancy Portal
        </h1>
      </div>

      <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">
        Hi ${tenantName},
      </h2>

      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px;">
        ${landlordName ? `<strong>${landlordName}</strong> has` : 'Your landlord has'} invited you to the Tenancy Portal${propertyAddress ? ` for <strong>${propertyAddress}</strong>` : ''}.
      </p>

      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Through the portal you'll be able to view your tenancy documents, confirm receipt of important compliance certificates, and communicate with your landlord.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none;">
          Accept Invitation &amp; Register
        </a>
      </div>

      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 8px;">
        Or copy this link into your browser:
      </p>
      <p style="font-size: 13px; color: #64748b; word-break: break-all; margin: 0 0 32px;">
        ${inviteLink}
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        Sent via <a href="https://tenancy-portal.co.uk" style="color: #0f766e; text-decoration: none;">Tenancy Portal</a>
      </p>
    </div>
  `

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tenancy Portal <noreply@tenancy-portal.co.uk>',
        to: [tenantEmail],
        subject: `${landlordName || 'Your landlord'} has invited you to the Tenancy Portal`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to send invitation email', details: errorText }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    const result = await resendResponse.json()

    return new Response(JSON.stringify({ success: true, emailId: (result as any).id }), {
      headers: corsHeaders,
    })
  } catch (err) {
    console.error('Email send error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send invitation email' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}
