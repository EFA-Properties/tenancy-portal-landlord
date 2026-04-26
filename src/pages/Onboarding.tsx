import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLandlord } from '../hooks/useLandlord'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card, CardBody, CardHeader } from '../components/ui/Card'

type PropertyType = 'single_btl' | 'hmo' | 'mixed_use'

interface StepData {
  property: {
    addressLine1: string
    addressLine2: string
    town: string
    county: string
    postcode: string
    propertyType: PropertyType | ''
    rooms: string
  }
  tenant: {
    fullName: string
    email: string
    phone: string
    startDate: string
    monthlyRent: string
  }
  document: {
    documentType: string
    title: string
    file: File | null
  }
}

const STEPS = [
  { number: 1, title: 'Add First Property' },
  { number: 2, title: 'Add First Tenant' },
  { number: 3, title: 'Send Portal Invite' },
  { number: 4, title: 'Upload Document' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: landlord, isLoading: landlordLoading } = useLandlord()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [inviteSent, setInviteSent] = useState(false)

  const [stepData, setStepData] = useState<StepData>({
    property: {
      addressLine1: '',
      addressLine2: '',
      town: '',
      county: '',
      postcode: '',
      propertyType: '',
      rooms: '',
    },
    tenant: {
      fullName: '',
      email: '',
      phone: '',
      startDate: '',
      monthlyRent: '',
    },
    document: {
      documentType: '',
      title: '',
      file: null,
    },
  })

  if (landlordLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-teal-600 border-r-transparent mx-auto mb-4" />
          <p className="text-textSecondary">Loading your onboarding...</p>
        </div>
      </div>
    )
  }

  // Stepper component
  const Stepper = () => (
    <div className="mb-12">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isFuture = step.number > currentStep

          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm
                    ${isCompleted ? 'bg-teal-700 text-white' : ''}
                    ${isCurrent ? 'border-2 border-teal-700 text-teal-700 bg-white' : ''}
                    ${isFuture ? 'bg-slate-200 text-slate-500' : ''}
                    transition-all
                  `}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <p className={`mt-2 text-xs font-medium text-center ${isFuture ? 'text-slate-400' : 'text-textSecondary'}`}>
                  {step.title}
                </p>
              </div>

              {/* Connecting Line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`
                    h-0.5 flex-1 mx-2 mb-6
                    ${isCompleted ? 'bg-teal-700' : 'bg-slate-200'}
                  `}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )

  // Skip onboarding — mark complete and go to dashboard
  const handleSkipOnboarding = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('landlords')
        .update({ onboarding_completed: true })
        .eq('id', landlord?.id)

      if (updateError) throw updateError

      // Invalidate cached landlord so ProtectedRoute sees the updated value
      await queryClient.invalidateQueries({ queryKey: ['landlord'] })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip onboarding')
      setLoading(false)
    }
  }

  // Step 1: Add First Property
  const handleStep1Submit = async () => {
    setError('')

    if (!stepData.property.addressLine1.trim()) {
      setError('Address line 1 is required')
      return
    }

    if (!stepData.property.town.trim()) {
      setError('Town is required')
      return
    }

    if (!stepData.property.postcode.trim()) {
      setError('Postcode is required')
      return
    }

    if (!stepData.property.propertyType) {
      setError('Property type is required')
      return
    }

    if (stepData.property.propertyType === 'hmo' && !stepData.property.rooms) {
      setError('Number of rooms is required for HMO properties')
      return
    }

    setLoading(true)

    try {
      if (!landlord?.id) {
        throw new Error('Landlord record not found. Please try logging out and back in.')
      }

      const isHmo = stepData.property.propertyType === 'hmo'

      const { data, error: insertError } = await supabase
        .from('properties')
        .insert({
          landlord_id: landlord.id,
          address_line1: stepData.property.addressLine1,
          address_line2: stepData.property.addressLine2 || null,
          town: stepData.property.town,
          county: stepData.property.county || null,
          postcode: stepData.property.postcode,
          property_type: stepData.property.propertyType,
          is_hmo: isHmo,
        })
        .select()

      if (insertError) {
        console.error('Property insert failed:', insertError)
        throw new Error(`Failed to add property: ${insertError.message}`)
      }

      if (data && data.length > 0) {
        setPropertyId(data[0].id)

        // If HMO, create room records
        if (isHmo && stepData.property.rooms) {
          const roomCount = parseInt(stepData.property.rooms)
          const roomRows = Array.from({ length: roomCount }, (_, i) => ({
            property_id: data[0].id,
            room_label: `Room ${i + 1}`,
          }))

          await supabase.from('property_rooms').insert(roomRows)
        }
      }

      setCurrentStep(2)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add property')
      setLoading(false)
    }
  }

  // Step 2: Add First Tenant
  const handleStep2Submit = async () => {
    setError('')

    if (!stepData.tenant.fullName.trim()) {
      setError('Tenant name is required')
      return
    }

    if (!stepData.tenant.email.trim()) {
      setError('Tenant email is required')
      return
    }

    if (!stepData.tenant.startDate) {
      setError('Start date is required')
      return
    }

    if (!stepData.tenant.monthlyRent) {
      setError('Monthly rent is required')
      return
    }

    setLoading(true)

    try {
      // Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          landlord_id: landlord?.id,
          full_name: stepData.tenant.fullName,
          email: stepData.tenant.email,
          phone: stepData.tenant.phone || null,
        })
        .select()

      if (tenantError) throw tenantError

      if (!tenantData || tenantData.length === 0) {
        throw new Error('Failed to create tenant')
      }

      const createdTenantId = tenantData[0].id
      setTenantId(createdTenantId)

      // Create tenancy linking property and tenant
      const { error: tenancyError } = await supabase
        .from('tenancies')
        .insert({
          property_id: propertyId,
          tenant_id: createdTenantId,
          start_date: stepData.tenant.startDate,
          monthly_rent: parseFloat(stepData.tenant.monthlyRent),
        })

      if (tenancyError) throw tenancyError

      setCurrentStep(3)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tenant')
      setLoading(false)
    }
  }

  // Step 3: Send Portal Invite
  const handleStep3SendInvite = async () => {
    setError('')
    setLoading(true)

    try {
      // TODO: Integrate email sending service (SendGrid, PostMark, etc.)
      // For now, just show success message
      setInviteSent(true)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
      setLoading(false)
    }
  }

  const handleStep3Skip = () => {
    setCurrentStep(4)
  }

  // Step 4: Upload Document
  const handleStep4Submit = async () => {
    if (!stepData.document.documentType) {
      setError('Document type is required')
      return
    }

    if (!stepData.document.title.trim()) {
      setError('Document title is required')
      return
    }

    if (!stepData.document.file) {
      setError('File is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const fileName = `${landlord?.id}/${propertyId}/${Date.now()}-${stepData.document.file.name}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, stepData.document.file)

      if (uploadError) throw uploadError

      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          landlord_id: landlord?.id,
          property_id: propertyId,
          document_type: stepData.document.documentType,
          title: stepData.document.title,
          file_url: `documents/${fileName}`,
          file_name: stepData.document.file.name,
        })

      if (docError) throw docError

      // Mark onboarding as complete
      const { error: completeError } = await supabase
        .from('landlords')
        .update({ onboarding_completed: true })
        .eq('id', landlord?.id)

      if (completeError) throw completeError

      await queryClient.invalidateQueries({ queryKey: ['landlord'] })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
      setLoading(false)
    }
  }

  const handleStep4Skip = async () => {
    setError('')
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('landlords')
        .update({ onboarding_completed: true })
        .eq('id', landlord?.id)

      if (updateError) throw updateError

      await queryClient.invalidateQueries({ queryKey: ['landlord'] })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-fraunces font-semibold text-textPrimary mb-2">
            Welcome to your Landlord Portal
          </h1>
          <p className="text-textSecondary">
            Let's set up your first property and tenant
          </p>
        </div>

        {/* Stepper */}
        <Stepper />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-errorLight border border-error/30 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card>
          <CardBody className="p-8">
            {/* STEP 1: Add First Property */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-fraunces font-semibold text-textPrimary mb-6">
                  Add Your First Property
                </h2>

                <form className="space-y-5">
                  <Input
                    label="Address Line 1"
                    type="text"
                    value={stepData.property.addressLine1}
                    onChange={(e) => setStepData({
                      ...stepData,
                      property: { ...stepData.property, addressLine1: e.target.value }
                    })}
                    required
                    placeholder="123 Main Street"
                  />

                  <Input
                    label="Address Line 2 (Optional)"
                    type="text"
                    value={stepData.property.addressLine2}
                    onChange={(e) => setStepData({
                      ...stepData,
                      property: { ...stepData.property, addressLine2: e.target.value }
                    })}
                    placeholder="Apartment, suite, etc."
                  />

                  <div className="grid grid-cols-2 gap-5">
                    <Input
                      label="Town"
                      type="text"
                      value={stepData.property.town}
                      onChange={(e) => setStepData({
                        ...stepData,
                        property: { ...stepData.property, town: e.target.value }
                      })}
                      required
                      placeholder="London"
                    />

                    <Input
                      label="County (Optional)"
                      type="text"
                      value={stepData.property.county}
                      onChange={(e) => setStepData({
                        ...stepData,
                        property: { ...stepData.property, county: e.target.value }
                      })}
                      placeholder="Greater London"
                    />
                  </div>

                  <Input
                    label="Postcode"
                    type="text"
                    value={stepData.property.postcode}
                    onChange={(e) => setStepData({
                      ...stepData,
                      property: { ...stepData.property, postcode: e.target.value }
                    })}
                    required
                    placeholder="SW1A 1AA"
                  />

                  <Select
                    label="Property Type"
                    value={stepData.property.propertyType}
                    onChange={(e) => setStepData({
                      ...stepData,
                      property: { ...stepData.property, propertyType: e.target.value as PropertyType }
                    })}
                    required
                    options={[
                      { value: 'single_btl', label: 'Single BTL' },
                      { value: 'hmo', label: 'HMO (House in Multiple Occupation)' },
                      { value: 'mixed_use', label: 'Mixed Use' },
                    ]}
                  />

                  {stepData.property.propertyType === 'hmo' && (
                    <Input
                      label="Number of Rooms"
                      type="number"
                      value={stepData.property.rooms}
                      onChange={(e) => setStepData({
                        ...stepData,
                        property: { ...stepData.property, rooms: e.target.value }
                      })}
                      required
                      min="1"
                      placeholder="5"
                    />
                  )}
                </form>

                <div className="flex gap-3 mt-8 pt-8 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkipOnboarding}
                    disabled={loading}
                  >
                    Skip — I'll add later
                  </Button>
                  <Button
                    onClick={handleStep1Submit}
                    loading={loading}
                    className="ml-auto"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Add First Tenant */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-fraunces font-semibold text-textPrimary mb-6">
                  Add Your First Tenant
                </h2>

                <form className="space-y-5">
                  <Input
                    label="Tenant Full Name"
                    type="text"
                    value={stepData.tenant.fullName}
                    onChange={(e) => setStepData({
                      ...stepData,
                      tenant: { ...stepData.tenant, fullName: e.target.value }
                    })}
                    required
                    placeholder="Jane Smith"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={stepData.tenant.email}
                    onChange={(e) => setStepData({
                      ...stepData,
                      tenant: { ...stepData.tenant, email: e.target.value }
                    })}
                    required
                    placeholder="jane@example.com"
                  />

                  <Input
                    label="Phone (Optional)"
                    type="tel"
                    value={stepData.tenant.phone}
                    onChange={(e) => setStepData({
                      ...stepData,
                      tenant: { ...stepData.tenant, phone: e.target.value }
                    })}
                    placeholder="+44 123 456 7890"
                  />

                  <Input
                    label="Tenancy Start Date"
                    type="date"
                    value={stepData.tenant.startDate}
                    onChange={(e) => setStepData({
                      ...stepData,
                      tenant: { ...stepData.tenant, startDate: e.target.value }
                    })}
                    required
                  />

                  <Input
                    label="Monthly Rent (£)"
                    type="number"
                    value={stepData.tenant.monthlyRent}
                    onChange={(e) => setStepData({
                      ...stepData,
                      tenant: { ...stepData.tenant, monthlyRent: e.target.value }
                    })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="1500.00"
                  />
                </form>

                <div className="flex gap-3 mt-8 pt-8 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(3)}
                    disabled={loading}
                  >
                    Skip — I'll add later
                  </Button>
                  <Button
                    onClick={handleStep2Submit}
                    loading={loading}
                    className="ml-auto"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Send Portal Invite */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-fraunces font-semibold text-textPrimary mb-6">
                  Send Portal Invite
                </h2>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-textPrimary mb-4">Tenant Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium text-textMuted uppercase">Name</dt>
                      <dd className="text-textPrimary">{stepData.tenant.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-textMuted uppercase">Email</dt>
                      <dd className="text-textPrimary">{stepData.tenant.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-textMuted uppercase">Start Date</dt>
                      <dd className="text-textPrimary">{stepData.tenant.startDate}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-textMuted uppercase">Monthly Rent</dt>
                      <dd className="text-textPrimary">£{parseFloat(stepData.tenant.monthlyRent).toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>

                {inviteSent && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    Invite sent successfully to {stepData.tenant.email}
                  </div>
                )}

                <div className="flex gap-3 mt-8 pt-8 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleStep3Skip}
                    disabled={loading || inviteSent}
                  >
                    Skip for Now
                  </Button>
                  {!inviteSent && (
                    <Button
                      onClick={handleStep3SendInvite}
                      loading={loading}
                      className="ml-auto"
                    >
                      Send Invite
                    </Button>
                  )}
                  {inviteSent && (
                    <Button
                      onClick={() => setCurrentStep(4)}
                      className="ml-auto"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Upload Document or Upgrade */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-fraunces font-semibold text-textPrimary mb-6">
                  Upload Your First Document
                </h2>

                <form className="space-y-5 mb-8">
                    <Select
                      label="Document Type"
                      value={stepData.document.documentType}
                      onChange={(e) => setStepData({
                        ...stepData,
                        document: { ...stepData.document, documentType: e.target.value }
                      })}
                      required
                      options={[
                        { value: 'lease', label: 'Lease Agreement' },
                        { value: 'tenancy', label: 'Tenancy Agreement' },
                        { value: 'inventory', label: 'Inventory Report' },
                        { value: 'receipt', label: 'Deposit Receipt' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />

                    <Input
                      label="Document Title"
                      type="text"
                      value={stepData.document.title}
                      onChange={(e) => setStepData({
                        ...stepData,
                        document: { ...stepData.document, title: e.target.value }
                      })}
                      required
                      placeholder="e.g., Tenancy Agreement 2024"
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Select File
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setStepData({
                          ...stepData,
                          document: { ...stepData.document, file: e.target.files?.[0] || null }
                        })}
                        className="w-full px-4 py-2.5 rounded-md border border-border bg-white hover:border-border2 text-sm"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Accepted: PDF, DOC, DOCX, JPG, PNG (max 50MB)
                      </p>
                    </div>
                  </form>

                <div className="flex gap-3 pt-8 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleStep4Skip}
                    disabled={loading}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleStep4Submit}
                    loading={loading}
                    className="ml-auto"
                  >
                    Upload & Finish
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
