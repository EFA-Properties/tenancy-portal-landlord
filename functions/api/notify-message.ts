import { createClient } from '@supabase/supabase-js'

interface Env {
  RESEND_API_KEY?: string
  TENANT_PORTAL_URL?: string
  LANDLORD_PORTAL_URL?: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://landlord.tenancy-portal.co.uk',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const resendKey = context.env.RESEND_API_KEY
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  // Verify authentication
  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  try {
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: corsHeaders,
      })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
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

  const {
    recipientName,
    recipientEmail,
    senderName,
    messagePreview,
    propertyAddress,
    senderType, // 'landlord' or 'tenant'
    tenancyId,
  } = body

  if (!recipientEmail || !messagePreview) {
    return new Response(JSON.stringify({ error: 'recipientEmail and messagePreview are required' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  // Link to the appropriate portal
  const isRecipientTenant = senderType === 'landlord'
  const portalUrl = isRecipientTenant
    ? (context.env.TENANT_PORTAL_URL || 'https://tenant.tenancy-portal.co.uk')
    : (context.env.LANDLORD_PORTAL_URL || 'https://landlord.tenancy-portal.co.uk')
  const messagesLink = `${portalUrl}/messages/${tenancyId || ''}`

  // Truncate preview to 200 chars
  const preview = messagePreview.length > 200
    ? messagePreview.slice(0, 200) + '…'
    : messagePreview

  const emailHtml = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 28px; color: #0f766e; margin: 0;">
          Tenancy Portal
        </h1>
      </div>

      <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">
        New message from ${escapeHtml(senderName || (senderType === 'landlord' ? 'your landlord' : 'your tenant'))}
      </h2>

      ${propertyAddress ? `<p style="font-size: 13px; color: #64748b; margin: 0 0 16px;">Re: ${escapeHtml(propertyAddress)}</p>` : ''}

      <div style="background: #f8fafc; border-left: 3px solid #0f766e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0; color: #334155;">
          ${escapeHtml(preview).replace(/\n/g, '<br>')}
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${messagesLink}" style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none;">
          Reply in Portal
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        Sent via <a href="https://tenancy-portal.co.uk" style="color: #0f766e; text-decoration: none;">Tenancy Portal</a>.
        You're receiving this because you have an active tenancy.
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
        from: 'Tenancy Portal <notifications@tenancy-portal.co.uk>',
        to: [recipientEmail],
        subject: `New message from ${escapeHtml(senderName || (senderType === 'landlord' ? 'your landlord' : 'your tenant'))}`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
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
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}
