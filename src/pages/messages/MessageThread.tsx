import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMessages, useSendMessage } from '../../hooks/useMessages'
import { useLandlord } from '../../hooks/useLandlord'
import { supabase } from '../../lib/supabase'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()

  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`

  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${time}`
}

export default function MessageThread() {
  const { tenancyId } = useParams<{ tenancyId: string }>()
  const navigate = useNavigate()
  const { data: messages = [], isLoading } = useMessages(tenancyId)
  const { data: landlord } = useLandlord()
  const sendMessage = useSendMessage()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [tenancyInfo, setTenancyInfo] = useState<{ propertyAddress: string; tenantName: string } | null>(null)

  // Load tenancy info
  useEffect(() => {
    if (!tenancyId) return
    const load = async () => {
      const { data } = await supabase
        .from('tenancies')
        .select('properties(address_line1, town), tenancy_tenants(tenants(full_name))')
        .eq('id', tenancyId)
        .single()
      if (data) {
        const prop = (data as any).properties
        const tenant = (data as any).tenancy_tenants?.[0]?.tenants
        setTenancyInfo({
          propertyAddress: prop ? `${prop.address_line1}, ${prop.town}` : 'Unknown',
          tenantName: tenant?.full_name || 'Unknown tenant',
        })
      }
    }
    load()
  }, [tenancyId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !tenancyId || !landlord) return
    setNewMessage('')
    try {
      await sendMessage.mutateAsync({
        tenancyId,
        senderId: landlord.id,
        body: newMessage.trim(),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <Breadcrumb
        items={[
          { label: 'Messages', href: '/messages' },
          { label: tenancyInfo?.tenantName || 'Conversation' },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-fraunces font-semibold text-slate-900">
            {tenancyInfo?.tenantName || 'Loading...'}
          </h1>
          <p className="text-sm text-slate-400">{tenancyInfo?.propertyAddress}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
          Back
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardBody className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
              No messages yet. Start the conversation below.
            </div>
          ) : (
            messages.map((msg) => {
              const isLandlord = msg.sender_type === 'landlord'
              return (
                <div
                  key={msg.id}
                  className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      isLandlord
                        ? 'bg-teal-700 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isLandlord ? 'text-teal-200' : 'text-slate-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </CardBody>

        {/* Message input */}
        <div className="border-t border-border p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
              loading={sendMessage.isPending}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
