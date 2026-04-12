import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../lib/supabase'

const inviteTenantSchema = z.object({
  email: z.string().email('Invalid email'),
  tenancy_id: z.string().min(1, 'Tenancy is required'),
})

type InviteTenantFormData = z.infer<typeof inviteTenantSchema>

export function InviteTenant() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteTenantFormData>({
    resolver: zodResolver(inviteTenantSchema),
  })

  const onSubmit = async (data: InviteTenantFormData) => {
    try {
      setError('')
      setIsLoading(true)
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('portal_invites')
        .insert([
          {
            email: data.email,
            tenancy_id: data.tenancy_id,
            tenant_id: '', // Will be set when tenant is created
            token: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ])

      if (insertError) throw insertError
      setSuccess(true)
      reset()
      setTimeout(() => {
        navigate('/tenants')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Tenants
      </button>

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Invite Tenant
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Send Portal Invite</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                Invite sent successfully! Redirecting...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Tenant Email"
              type="email"
              placeholder="tenant@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Select
              label="Tenancy"
              options={[
                { value: 'tenancy1', label: 'Tenancy 1' }
              ]}
              {...register('tenancy_id')}
              error={errors.tenancy_id?.message}
            />

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Send Invite
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tenants')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
