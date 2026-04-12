import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { useLegalEntities } from '../../hooks/useLegalEntities'
import { useCreateProperty } from '../../hooks/useProperties'

const addPropertySchema = z.object({
  legal_entity_id: z.string().min(1, 'Legal entity is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  town: z.string().min(1, 'Town is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  property_type: z.enum(['btl', 'hmo', 'commercial', 'holiday_let'], {
    errorMap: () => ({ message: 'Property type is required' })
  }),
})

type AddPropertyFormData = z.infer<typeof addPropertySchema>

export function AddProperty() {
  const navigate = useNavigate()
  const { data: legalEntities } = useLegalEntities()
  const { mutate: createProperty, isPending } = useCreateProperty()
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddPropertyFormData>({
    resolver: zodResolver(addPropertySchema),
  })

  const onSubmit = async (data: AddPropertyFormData) => {
    try {
      setError('')
      createProperty(data as any, {
        onSuccess: () => {
          navigate('/properties')
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to create property')
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/properties')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Properties
      </button>

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Add New Property
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Select
              label="Legal Entity"
              options={(legalEntities || []).map(e => ({
                value: e.id,
                label: e.name
              }))}
              {...register('legal_entity_id')}
              error={errors.legal_entity_id?.message}
            />

            <Input
              label="Address Line 1"
              placeholder="123 Main Street"
              {...register('address_line1')}
              error={errors.address_line1?.message}
            />

            <Input
              label="Address Line 2 (Optional)"
              placeholder="Apartment, suite, etc."
              {...register('address_line2')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Town"
                placeholder="London"
                {...register('town')}
                error={errors.town?.message}
              />

              <Input
                label="Postcode"
                placeholder="SW1A 1AA"
                {...register('postcode')}
                error={errors.postcode?.message}
              />
            </div>

            <Select
              label="Property Type"
              options={[
                { value: 'btl', label: 'Buy to Let' },
                { value: 'hmo', label: 'HMO' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'holiday_let', label: 'Holiday Let' }
              ]}
              {...register('property_type')}
              error={errors.property_type?.message}
            />

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                isLoading={isPending}
              >
                Create Property
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/properties')}
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
