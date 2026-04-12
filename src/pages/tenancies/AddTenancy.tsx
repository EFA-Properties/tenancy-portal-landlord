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
import { useCreateTenancy } from '../../hooks/useTenancies'

const addTenancySchema = z.object({
  unit_id: z.string().min(1, 'Unit is required'),
  property_id: z.string().min(1, 'Property is required'),
  legal_entity_id: z.string().min(1, 'Legal entity is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  monthly_rent: z.coerce.number().min(0, 'Rent amount must be positive'),
  rent_due_day: z.coerce.number().min(1).max(31).default(1),
  deposit_amount: z.coerce.number().min(0).optional(),
  deposit_scheme: z.enum(['dps', 'tds', 'mydeposits']).optional(),
  deposit_scheme_ref: z.string().optional(),
  tenancy_type: z.enum(['periodic', 'fixed_term']).default('fixed_term'),
  status: z.enum(['active', 'ended', 'pending']).default('pending'),
})

type AddTenancyFormData = z.infer<typeof addTenancySchema>

export function AddTenancy() {
  const navigate = useNavigate()
  const { mutate: createTenancy, isPending } = useCreateTenancy()
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTenancyFormData>({
    resolver: zodResolver(addTenancySchema),
  })

  const onSubmit = async (data: AddTenancyFormData) => {
    try {
      setError('')
      createTenancy(data as any, {
        onSuccess: () => {
          navigate('/tenancies')
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to create tenancy')
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/tenancies')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Tenancies
      </button>

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Create New Tenancy
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tenancy Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Unit ID"
              placeholder="Unit identifier"
              {...register('unit_id')}
              error={errors.unit_id?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                {...register('start_date')}
                error={errors.start_date?.message}
              />
              <Input
                label="End Date (Optional)"
                type="date"
                {...register('end_date')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Monthly Rent"
                type="number"
                placeholder="0.00"
                {...register('monthly_rent')}
                error={errors.monthly_rent?.message}
              />
              <Input
                label="Rent Due Day (1-31)"
                type="number"
                placeholder="1"
                {...register('rent_due_day')}
                error={errors.rent_due_day?.message}
              />
            </div>

            <Input
              label="Deposit Amount"
              type="number"
              placeholder="0.00"
              {...register('deposit_amount')}
            />

            <Select
              label="Deposit Scheme"
              options={[
                { value: 'dps', label: 'The Deposit Protection Service (DPS)' },
                { value: 'tds', label: 'Tenancy Deposit Scheme (TDS)' },
                { value: 'mydeposits', label: 'MyDeposits' }
              ]}
              {...register('deposit_scheme')}
            />

            <Input
              label="Deposit Scheme Reference"
              placeholder="e.g., ABC123456"
              {...register('deposit_scheme_ref')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tenancy Type"
                options={[
                  { value: 'periodic', label: 'Periodic' },
                  { value: 'fixed_term', label: 'Fixed Term' }
                ]}
                {...register('tenancy_type')}
                error={errors.tenancy_type?.message}
              />

              <Select
                label="Status"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'active', label: 'Active' },
                  { value: 'ended', label: 'Ended' }
                ]}
                {...register('status')}
                error={errors.status?.message}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                isLoading={isPending}
              >
                Create Tenancy
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tenancies')}
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
