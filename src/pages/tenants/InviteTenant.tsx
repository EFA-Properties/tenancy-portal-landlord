import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useLandlord } from '../../hooks/useLandlord'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export default function InviteTenant() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: landlord } = useLandlord()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    property_id: '',
  })
  const [properties, setProperties] = useState<Array<{ id: string; address_line1: string; town: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadProperties = async () => {
      if (!landlord) return
      const { data } = await supabase
        .from('properties')
        .select('id, address_line1, town')
        .eq('landlord_id', landlord.id)
      setProperties(data || [])
    }
    loadProperties()
  }, [landlord])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // 1. Create tenant record with invite status
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          invite_status: 'invited',
          invited_at: new Date().toISOString(),
        })
        .select('id, invite_token')
        .single()

      if (tenantError) throw tenantError

      // 2. Get the property address for the email
      const selectedProp = properties.find((p) => p.id === formData.property_id)
      const propertyAddress = selectedProp
        ? `${selectedProp.address_line1}, ${selectedProp.town}`
        : undefined

      // 3. Send invite email via Cloudflare Pages Function
      const emailRes = await fetch('/api/invite-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: formData.full_name,
          tenantEmail: formData.email,
          landlordName: landlord?.full_name || user.user_metadata?.full_name || undefined,
          propertyAddress,
          inviteToken: tenant.invite_token,
        }),
      })

      if (!emailRes.ok) {
        const errData = await emailRes.json().catch(() => ({}))
        console.error('Invite email failed:', errData)
        // Tenant is created but email failed — don't block, just warn
        setError('Tenant created but invitation email could not be sent. You can resend from the tenant detail page.')
        setSuccess(true)
      } else {
        setSuccess(true)
      }

      // 4. Invalidate tenant queries so lists update
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants-with-status'] })

      // Navigate after a brief delay so user sees success
      setTimeout(() => navigate('/tenants'), 1500)
    } catch (err) {
      console.error('Error inviting tenant:', err)
      setError(err instanceof Error ? err.message : 'Failed to invite tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenants', href: '/tenants' },
          { label: 'Invite Tenant' },
        ]}
      />

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Invite New Tenant
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Tenant Information
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            An invitation email will be sent to the tenant with a link to register on the portal.
          </p>
        </CardHeader>
        <CardBody>
          {success ? (
            <div className="p-6 bg-teal-50 border border-teal-200 rounded-lg text-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#0f766e" strokeWidth="2" />
                  <path d="M8 12l2.5 2.5L16 9" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-teal-900">Invitation sent to {formData.email}</p>
              <p className="text-xs text-teal-700 mt-1">Redirecting to tenants list...</p>
              {error && (
                <p className="text-xs text-amber-700 mt-2">{error}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-600 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="07700 000000"
              />

              <Input
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />

              {properties.length > 0 && (
                <Select
                  label="Property (optional)"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select a property...' },
                    ...properties.map((p) => ({
                      value: p.id,
                      label: `${p.address_line1}, ${p.town}`,
                    })),
                  ]}
                />
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" loading={loading}>
                  Send Invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/tenants')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
