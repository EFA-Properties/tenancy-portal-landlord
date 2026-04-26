import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Message {
  id: string
  tenancy_id: string
  sender_type: 'landlord' | 'tenant'
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export function useMessages(tenancyId: string | undefined) {
  return useQuery({
    queryKey: ['messages', tenancyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('tenancy_id', tenancyId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Message[]
    },
    enabled: !!tenancyId,
    refetchInterval: 15000, // Poll every 15 seconds for new messages
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tenancyId,
      senderId,
      body,
      notifyRecipient,
    }: {
      tenancyId: string
      senderId: string
      body: string
      notifyRecipient?: {
        recipientName: string
        recipientEmail: string
        senderName: string
        propertyAddress?: string
      }
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          tenancy_id: tenancyId,
          sender_type: 'landlord',
          sender_id: senderId,
          body,
        })
        .select()
        .single()
      if (error) throw error

      // Fire-and-forget email notification
      if (notifyRecipient?.recipientEmail) {
        fetch('/api/notify-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientName: notifyRecipient.recipientName,
            recipientEmail: notifyRecipient.recipientEmail,
            senderName: notifyRecipient.senderName,
            messagePreview: body,
            propertyAddress: notifyRecipient.propertyAddress,
            senderType: 'landlord',
            tenancyId,
          }),
        }).catch((err) => console.warn('Failed to send message notification:', err))
      }

      return data as Message
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.tenancyId] })
    },
  })
}

/**
 * Get all tenancies with their latest message for the messages inbox.
 */
export function useMessageInbox() {
  return useQuery({
    queryKey: ['message-inbox'],
    queryFn: async () => {
      // Get all tenancies with property and tenant info
      const { data: tenancies, error: tErr } = await supabase
        .from('tenancies')
        .select('id, property_id, properties(address_line1, town), tenancy_tenants(tenant_id, tenants(full_name))')
        .eq('status', 'active')

      if (tErr) throw tErr

      // Get latest message for each tenancy
      const { data: messages, error: mErr } = await supabase
        .from('messages')
        .select('tenancy_id, body, sender_type, created_at, read_at')
        .order('created_at', { ascending: false })

      if (mErr) throw mErr

      // Group latest message by tenancy_id
      const latestByTenancy = new Map<string, any>()
      for (const msg of (messages || [])) {
        if (!latestByTenancy.has(msg.tenancy_id)) {
          latestByTenancy.set(msg.tenancy_id, msg)
        }
      }

      // Count unread messages per tenancy
      const unreadByTenancy = new Map<string, number>()
      for (const msg of (messages || [])) {
        if (msg.sender_type === 'tenant' && !msg.read_at) {
          unreadByTenancy.set(msg.tenancy_id, (unreadByTenancy.get(msg.tenancy_id) || 0) + 1)
        }
      }

      return (tenancies || []).map((t: any) => {
        const latest = latestByTenancy.get(t.id)
        const tenantLink = t.tenancy_tenants?.[0]
        return {
          tenancyId: t.id,
          propertyAddress: t.properties ? `${t.properties.address_line1}, ${t.properties.town}` : 'Unknown',
          tenantName: tenantLink?.tenants?.full_name || 'No tenant linked',
          latestMessage: latest?.body || null,
          latestMessageAt: latest?.created_at || null,
          latestSenderType: latest?.sender_type || null,
          unreadCount: unreadByTenancy.get(t.id) || 0,
        }
      }).sort((a: any, b: any) => {
        // Sort by latest message (most recent first), tenancies with no messages at the bottom
        if (!a.latestMessageAt && !b.latestMessageAt) return 0
        if (!a.latestMessageAt) return 1
        if (!b.latestMessageAt) return -1
        return new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime()
      })
    },
  })
}
