import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useLegalEntities, useCreateLegalEntity, useUpdateLegalEntity } from '../hooks/useLegalEntities'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const legalEntitySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  company_number: z.string().optional(),
  registered_address: z.string().optional(),
  is_company: z.boolean().default(true),
})

type LegalEntityFormData = z.infer<typeof legalEntitySchema>

export function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: legalEntities } = useLegalEntities()
  const { mutate: createEntity, isPending: isCreating } = useCreateLegalEntity()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LegalEntityFormData>({
    resolver: zodResolver(legalEntitySchema),
  })

  const onSubmit = async (data: LegalEntityFormData) => {
    try {
      setError('')
      if (!user) throw new Error('Not authenticated')

      createEntity(
        {
          landlord_id: user.id,
          name: data.name,
          company_number: data.company_number,
          registered_address: data.registered_address,
          is_company: data.is_company,
        } as any,
        {
          onSuccess: () => {
            reset()
            setIsModalOpen(false)
          },
          onError: (err) => {
            setError(err instanceof Error ? err.message : 'Failed to create entity')
          },
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings' }
      ]} />

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Settings
      </h1>

      {/* Profile Card */}
      <Card className="mb-8 max-w-2xl">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Email</p>
              <p className="font-medium text-slate-900">{user?.email}</p>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <Button variant="secondary">
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Entities */}
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Legal Entities</CardTitle>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Entity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!legalEntities || legalEntities.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No legal entities yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {legalEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-md border border-slate-200"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {entity.name}
                    </h4>
                    <div className="space-y-1 text-sm text-slate-500">
                      <p>Type: {entity.is_company ? 'Company' : 'Individual'}</p>
                      {entity.company_number && <p>Company Number: {entity.company_number}</p>}
                      {entity.registered_address && <p>Address: {entity.registered_address}</p>}
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-red-600 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          reset()
          setError('')
        }}
        title="Add Legal Entity"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Input
            label="Name"
            placeholder="Your Company Ltd or Your Name"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Company Number (Optional)"
            placeholder="12345678"
            {...register('company_number')}
          />

          <Input
            label="Registered Address (Optional)"
            placeholder="123 High Street, London, SW1A 1AA"
            {...register('registered_address')}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isCreating}>
              Create Entity
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
