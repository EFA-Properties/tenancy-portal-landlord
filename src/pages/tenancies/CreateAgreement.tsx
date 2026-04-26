import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTenancy } from '../../hooks/useTenancies'
import { useLandlord } from '../../hooks/useLandlord'
import { useCreateAgreement, useSignAgreementAsLandlord } from '../../hooks/useAgreements'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import {
  type AgreementFormData,
  getDefaultFormData,
  generateAgreementClauses,
  renderAgreementText,
  DEPOSIT_SCHEMES,
  FURNISHING_OPTIONS,
} from '../../lib/agreementTemplate'
import { downloadAgreementPdf } from '../../lib/generateAgreementPdf'

type Step = 'details' | 'review' | 'sign' | 'done'
type SignatureMode = 'draw' | 'type'

const STEPS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Agreement Details' },
  { key: 'review', label: 'Review Agreement' },
  { key: 'sign', label: 'Sign & Send' },
  { key: 'done', label: 'Complete' },
]

export default function CreateAgreement() {
  const { tenancyId } = useParams<{ tenancyId: string }>()
  const [searchParams] = useSearchParams()
  const docType = (searchParams.get('type') || 'tenancy_agreement') as 'tenancy_agreement' | 'inventory'
  const navigate = useNavigate()
  const { data: tenancy } = useTenancy(tenancyId)
  const { data: landlord } = useLandlord()
  const createAgreement = useCreateAgreement()
  const signAsLandlord = useSignAgreementAsLandlord()

  const [step, setStep] = useState<Step>('details')
  const [agreementId, setAgreementId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<AgreementFormData | null>(null)

  // Signature state
  const [signMode, setSignMode] = useState<SignatureMode>('type')
  const [typedSignature, setTypedSignature] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const property = (tenancy as any)?.properties
  const tenant = (tenancy as any)?.tenants

  // Initialise form data from tenancy + landlord info
  useEffect(() => {
    if (tenancy && landlord && property && tenant && !formData) {
      const address = [property.address_line1, property.address_line2, property.town, property.county]
        .filter(Boolean)
        .join(', ')

      setFormData(
        getDefaultFormData(
          landlord.full_name,
          '', // landlord address — they fill this in
          tenant.full_name,
          tenant.email || '',
          address,
          property.postcode || '',
          property.property_type || 'Residential dwelling',
          tenancy.start_date,
          tenancy.monthly_rent,
        ),
      )
      setTypedSignature(landlord.full_name)
    }
  }, [tenancy, landlord, property, tenant, formData])

  // Generated clauses (memoised)
  const clauses = useMemo(
    () => (formData ? generateAgreementClauses(formData) : []),
    [formData],
  )

  // ── Field updater ──────────────────────────────────────────
  function updateField<K extends keyof AgreementFormData>(key: K, value: AgreementFormData[K]) {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  // ── Canvas Drawing ─────────────────────────────────────────
  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      }
    },
    [],
  )

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      isDrawing.current = true
      lastPos.current = getCanvasPos(e)
    },
    [getCanvasPos],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (!isDrawing.current || !lastPos.current) return
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !canvas) return
      const pos = getCanvasPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      lastPos.current = pos
    },
    [getCanvasPos],
  )

  const endDraw = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getSignatureData = useCallback((): string | null => {
    if (signMode === 'type') return typedSignature.trim() || null
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const hasContent = imageData.data.some((val, i) => i % 4 === 3 && val > 0)
    return hasContent ? canvas.toDataURL('image/png') : null
  }, [signMode, typedSignature])

  // ── Validation ─────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validateDetails(): boolean {
    if (!formData) return false
    const errors: Record<string, string> = {}

    if (!formData.landlordName.trim()) errors.landlordName = 'Required'
    if (!formData.landlordAddress.trim()) errors.landlordAddress = 'Required — this appears on the agreement'
    if (!formData.tenantName.trim()) errors.tenantName = 'Required'
    if (!formData.propertyAddress.trim()) errors.propertyAddress = 'Required'
    if (!formData.startDate) errors.startDate = 'Required'
    if (formData.monthlyRent <= 0) errors.monthlyRent = 'Must be greater than zero'
    if (formData.depositAmount <= 0) errors.depositAmount = 'Must be greater than zero'
    if (!formData.depositScheme) errors.depositScheme = 'Select a deposit protection scheme'

    // Check deposit doesn't exceed 5 weeks' rent
    const fiveWeeksRent = Math.round(((formData.monthlyRent * 12) / 52) * 5 * 100) / 100
    if (formData.depositAmount > fiveWeeksRent + 0.01) {
      errors.depositAmount = `Cannot exceed 5 weeks' rent (£${fiveWeeksRent.toFixed(2)})`
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Step Handlers ──────────────────────────────────────────
  const handleContinueToReview = () => {
    if (!validateDetails()) {
      setError('Please correct the highlighted fields before continuing.')
      return
    }
    setError('')
    setFieldErrors({})
    setStep('review')
    window.scrollTo(0, 0)
  }

  const handleContinueToSign = async () => {
    if (!tenancyId || !formData) return
    setError('')
    try {
      const agreement = await createAgreement.mutateAsync({
        tenancyId,
        type: docType,
        title:
          docType === 'inventory'
            ? 'Inventory & Schedule of Condition'
            : `Assured Tenancy Agreement — ${formData.propertyPostcode}`,
        content: JSON.stringify(formData),
      })
      setAgreementId(agreement.id)
      setStep('sign')
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agreement')
    }
  }

  const handleSignAndSend = async () => {
    if (!agreementId || !formData) return
    const sigData = getSignatureData()
    if (!sigData) {
      setError(signMode === 'draw' ? 'Please draw your signature.' : 'Please type your name.')
      return
    }
    setError('')
    try {
      await signAsLandlord.mutateAsync({
        agreementId,
        signatureData: sigData,
        signatureType: signMode === 'draw' ? 'drawn' : 'typed',
      })
      setStep('done')
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement')
    }
  }

  const handleDownloadPdf = () => {
    if (!formData) return
    const sigData = getSignatureData()
    downloadAgreementPdf(
      formData,
      sigData
        ? { data: sigData, type: signMode === 'draw' ? 'drawn' : 'typed', date: new Date().toISOString() }
        : undefined,
    )
  }

  // ── Loading & Error States ─────────────────────────────────

  if (!tenancy || !landlord || !formData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Tenancies', href: '/tenancies' },
            { label: 'Tenancy', href: `/tenancies/${tenancyId}` },
            { label: 'Create Agreement' },
          ]}
        />
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-sm text-slate-500 mb-4">
              You need to link a tenant to this tenancy before creating an agreement.
            </p>
            <Button onClick={() => navigate(`/tenancies/${tenancyId}`)}>Go to Tenancy</Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  // ── Step Progress Bar ──────────────────────────────────────
  const currentStepIdx = STEPS.findIndex((s) => s.key === step)

  const StepProgress = () => (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((s, idx) => {
        const isActive = idx === currentStepIdx
        const isComplete = idx < currentStepIdx
        return (
          <React.Fragment key={s.key}>
            {idx > 0 && (
              <div
                className={`flex-1 h-0.5 ${isComplete ? 'bg-teal-600' : 'bg-slate-200'}`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isComplete
                    ? 'bg-teal-600 text-white'
                    : isActive
                    ? 'bg-teal-700 text-white ring-2 ring-teal-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isComplete ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive ? 'text-teal-700' : isComplete ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // STEP 1: DETAILS
  // ═══════════════════════════════════════════════════════════
  if (step === 'details') {
    const fiveWeeksRent = Math.round(((formData.monthlyRent * 12) / 52) * 5 * 100) / 100

    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Tenancies', href: '/tenancies' },
            { label: property ? property.address_line1 : 'Tenancy', href: `/tenancies/${tenancyId}` },
            { label: 'Agreements', href: `/tenancies/${tenancyId}/agreements` },
            { label: 'Create Agreement' },
          ]}
        />

        <h1 className="text-2xl font-fraunces font-semibold text-slate-900 mb-2">
          Create Tenancy Agreement
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Assured Periodic Tenancy under the Renters' Rights Act 2025. Fields are auto-populated from your tenancy data — review and complete the remaining details.
        </p>

        <StepProgress />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Parties */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round">
                    <circle cx="10" cy="6" r="3" />
                    <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Parties</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Landlord Name"
                  value={formData.landlordName}
                  onChange={(e) => updateField('landlordName', e.target.value)}
                  error={fieldErrors.landlordName}
                  required
                />
                <Input
                  label="Landlord Address"
                  value={formData.landlordAddress}
                  onChange={(e) => updateField('landlordAddress', e.target.value)}
                  error={fieldErrors.landlordAddress}
                  placeholder="Your correspondence address"
                  helperText="This is required on the agreement for legal service of notices"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tenant Name"
                  value={formData.tenantName}
                  onChange={(e) => updateField('tenantName', e.target.value)}
                  error={fieldErrors.tenantName}
                  required
                />
                <Input
                  label="Tenant Email"
                  value={formData.tenantEmail}
                  onChange={(e) => updateField('tenantEmail', e.target.value)}
                  helperText="The agreement will be sent here for e-signature"
                />
              </div>
            </CardBody>
          </Card>

          {/* Property */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10L10 3l7 7v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Property</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Property Address"
                  value={formData.propertyAddress}
                  onChange={(e) => updateField('propertyAddress', e.target.value)}
                  error={fieldErrors.propertyAddress}
                  required
                />
                <Input
                  label="Postcode"
                  value={formData.propertyPostcode}
                  onChange={(e) => updateField('propertyPostcode', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Furnishing"
                  value={formData.furnishing}
                  onChange={(e) =>
                    updateField('furnishing', e.target.value as AgreementFormData['furnishing'])
                  }
                  options={FURNISHING_OPTIONS}
                />
                <Input
                  label="Permitted Occupants"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.permittedOccupants}
                  onChange={(e) => updateField('permittedOccupants', parseInt(e.target.value) || 1)}
                />
                <Select
                  label="Garden Maintenance"
                  value={formData.gardenMaintenance}
                  onChange={(e) =>
                    updateField('gardenMaintenance', e.target.value as 'tenant' | 'landlord')
                  }
                  options={[
                    { value: 'tenant', label: 'Tenant responsibility' },
                    { value: 'landlord', label: 'Landlord responsibility' },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round">
                    <path d="M10 2v16M6 6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2s-.9 2-2 2H7a2 2 0 000 4h6c1.1 0 2-.9 2-2" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Financial Terms</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Monthly Rent (£)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.monthlyRent}
                  onChange={(e) => updateField('monthlyRent', parseFloat(e.target.value) || 0)}
                  error={fieldErrors.monthlyRent}
                  required
                />
                <Input
                  label="Commencement Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  error={fieldErrors.startDate}
                  required
                />
                <Select
                  label="Rent Due Day"
                  value={String(formData.rentDueDay)}
                  onChange={(e) => updateField('rentDueDay', parseInt(e.target.value))}
                  options={Array.from({ length: 28 }, (_, i) => ({
                    value: String(i + 1),
                    label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} of each month`,
                  }))}
                />
              </div>
              <Input
                label="Payment Method"
                value={formData.paymentMethod}
                onChange={(e) => updateField('paymentMethod', e.target.value)}
                placeholder="e.g. Bank transfer, Standing order"
              />
            </CardBody>
          </Card>

          {/* Deposit */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="6" width="16" height="10" rx="1" />
                    <path d="M2 10h16" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Deposit Protection</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  Under the Tenant Fees Act 2019, the deposit is capped at 5 weeks' rent. Based on the
                  monthly rent of £{formData.monthlyRent.toLocaleString()}, the maximum deposit is{' '}
                  <strong>£{fiveWeeksRent.toFixed(2)}</strong>. The deposit must be protected in a
                  government-approved scheme within 30 days.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Deposit Amount (£)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.depositAmount}
                  onChange={(e) => updateField('depositAmount', parseFloat(e.target.value) || 0)}
                  error={fieldErrors.depositAmount}
                  helperText={`Max: £${fiveWeeksRent.toFixed(2)}`}
                  required
                />
                <Select
                  label="Deposit Scheme"
                  value={formData.depositScheme}
                  onChange={(e) =>
                    updateField('depositScheme', e.target.value as AgreementFormData['depositScheme'])
                  }
                  options={DEPOSIT_SCHEMES}
                  error={fieldErrors.depositScheme}
                  required
                />
                <Input
                  label="Deposit Reference"
                  value={formData.depositReference}
                  onChange={(e) => updateField('depositReference', e.target.value)}
                  placeholder="Scheme reference number (if known)"
                  helperText="Can be added later if not yet protected"
                />
              </div>
            </CardBody>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2v4M8 2v4M4 8h12M4 4h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Additional Terms</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Council Tax"
                  value={formData.councilTaxResponsibility}
                  onChange={(e) =>
                    updateField(
                      'councilTaxResponsibility',
                      e.target.value as 'tenant' | 'landlord',
                    )
                  }
                  options={[
                    { value: 'tenant', label: 'Tenant pays' },
                    { value: 'landlord', label: 'Landlord pays (included)' },
                  ]}
                />
                <Select
                  label="Utilities"
                  value={formData.utilitiesResponsibility}
                  onChange={(e) =>
                    updateField(
                      'utilitiesResponsibility',
                      e.target.value as 'tenant' | 'landlord',
                    )
                  }
                  options={[
                    { value: 'tenant', label: 'Tenant pays' },
                    { value: 'landlord', label: 'Landlord pays (included)' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.parkingIncluded}
                    onChange={(e) => updateField('parkingIncluded', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-sm text-slate-700">Parking space included</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.petsConsidered}
                    onChange={(e) => updateField('petsConsidered', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-sm text-slate-700">
                    Open to pet requests
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-400">
                Note: Under the Renters' Rights Act 2025, tenants have the right to request to keep a pet regardless of this setting. This only affects the wording of the pet clause in the agreement.
              </p>
            </CardBody>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <Button variant="outline" onClick={() => navigate(`/tenancies/${tenancyId}/agreements`)}>
              Cancel
            </Button>
            <Button onClick={handleContinueToReview}>Continue to Review</Button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 2: REVIEW AGREEMENT
  // ═══════════════════════════════════════════════════════════
  if (step === 'review') {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Tenancies', href: '/tenancies' },
            { label: property ? property.address_line1 : 'Tenancy', href: `/tenancies/${tenancyId}` },
            { label: 'Agreements', href: `/tenancies/${tenancyId}/agreements` },
            { label: 'Review Agreement' },
          ]}
        />

        <h1 className="text-2xl font-fraunces font-semibold text-slate-900 mb-2">
          Review Agreement
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Review all clauses below. This is the agreement that will be sent to {formData.tenantName} for signing.
        </p>

        <StepProgress />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Agreement Header */}
        <Card className="mb-4">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white border-0">
            <h2 className="font-fraunces text-lg font-semibold">Written Statement of Terms</h2>
            <p className="text-sm text-teal-100 mt-1">
              Assured Tenancy — Housing Act 1988 (as amended by the Renters' Rights Act 2025)
            </p>
          </CardHeader>
          <CardBody className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Landlord</p>
                <p className="font-medium text-slate-900">{formData.landlordName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Tenant</p>
                <p className="font-medium text-slate-900">{formData.tenantName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Monthly Rent</p>
                <p className="font-medium text-slate-900">
                  £{formData.monthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Deposit</p>
                <p className="font-medium text-slate-900">
                  £{formData.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Clauses */}
        <div className="space-y-3 mb-6">
          {clauses.map((clause) => (
            <Card key={clause.number}>
              <CardBody className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{clause.number}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 pt-1">{clause.title}</h3>
                </div>
                {clause.text && (
                  <p className="text-sm text-slate-600 mb-3 ml-10">{clause.text}</p>
                )}
                {clause.subclauses && (
                  <div className="space-y-2 ml-10">
                    {clause.subclauses.map((sub, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-xs font-mono text-teal-600 flex-shrink-0 pt-0.5">
                          {clause.number}.{idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed">{sub}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <Button
            variant="outline"
            onClick={() => {
              setStep('details')
              window.scrollTo(0, 0)
            }}
          >
            Back to Edit
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPdf}>
              Preview PDF
            </Button>
            <Button onClick={handleContinueToSign} loading={createAgreement.isPending}>
              Continue to Sign
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3: SIGN & SEND
  // ═══════════════════════════════════════════════════════════
  if (step === 'sign') {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Tenancies', href: '/tenancies' },
            { label: property ? property.address_line1 : 'Tenancy', href: `/tenancies/${tenancyId}` },
            { label: 'Agreements', href: `/tenancies/${tenancyId}/agreements` },
            { label: 'Sign Agreement' },
          ]}
        />

        <h1 className="text-2xl font-fraunces font-semibold text-slate-900 mb-2">
          Sign & Send to Tenant
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Sign below to confirm the agreement. It will then be sent to {formData.tenantName} ({formData.tenantEmail}) for their signature.
        </p>

        <StepProgress />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Summary Strip */}
        <Card className="mb-5">
          <CardBody className="p-4">
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div>
                <span className="text-slate-400">Property:</span>{' '}
                <span className="font-medium text-slate-900">{formData.propertyAddress}</span>
              </div>
              <div>
                <span className="text-slate-400">Tenant:</span>{' '}
                <span className="font-medium text-slate-900">{formData.tenantName}</span>
              </div>
              <div>
                <span className="text-slate-400">Rent:</span>{' '}
                <span className="font-medium text-slate-900">
                  £{formData.monthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2 })} pcm
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Signature Card */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Your Signature (Landlord)</h2>
          </CardHeader>
          <CardBody className="p-6">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setSignMode('type')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  signMode === 'type'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Type Name
              </button>
              <button
                type="button"
                onClick={() => setSignMode('draw')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  signMode === 'draw'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Draw Signature
              </button>
            </div>

            {signMode === 'type' ? (
              <div>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full legal name"
                  className="w-full rounded-lg border border-slate-200 px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: '22px',
                    fontStyle: 'italic',
                  }}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Your typed name serves as your legally binding electronic signature
                </p>
              </div>
            ) : (
              <div>
                <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={180}
                    className="w-full cursor-crosshair touch-none"
                    style={{ height: '180px' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                  <div className="absolute bottom-6 left-4 right-4 border-t border-slate-300" />
                  <p className="absolute bottom-1.5 left-4 text-[10px] text-slate-400 font-mono">
                    SIGN ABOVE THE LINE
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="mt-2 text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear signature
                </button>
              </div>
            )}

            {/* Legal notice */}
            <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                By signing, you confirm that: (a) you are the landlord named in this agreement or an
                authorised agent acting on their behalf; (b) the information in this agreement is
                accurate and complete; (c) you understand and accept the obligations set out in this
                agreement. Your signature, the date and time, and your IP address will be recorded for
                legal verification purposes.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-5 pb-4">
          <Button
            variant="outline"
            onClick={() => {
              setStep('review')
              window.scrollTo(0, 0)
            }}
          >
            Back to Review
          </Button>
          <Button onClick={handleSignAndSend} loading={signAsLandlord.isPending}>
            Sign & Send to Tenant
          </Button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 4: DONE
  // ═══════════════════════════════════════════════════════════
  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          { label: property ? property.address_line1 : 'Tenancy', href: `/tenancies/${tenancyId}` },
          { label: 'Agreement Sent' },
        ]}
      />

      <StepProgress />

      <Card>
        <CardBody className="p-8 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="h-8 w-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-2">
            Agreement Signed & Sent
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            The tenancy agreement has been signed by you and sent to{' '}
            <span className="font-medium text-slate-700">{formData.tenantName}</span> for their
            e-signature. You'll be notified when they sign.
          </p>

          {/* What happens next */}
          <div className="bg-slate-50 rounded-lg p-5 mb-6 text-left max-w-lg mx-auto">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">What happens next</h3>
            <div className="space-y-3">
              {[
                { num: '1', text: `${formData.tenantName} receives the agreement in their tenant portal` },
                { num: '2', text: 'They review the terms and add their e-signature' },
                {
                  num: '3',
                  text: 'Both signatures are recorded — the agreement is fully executed',
                },
                { num: '4', text: 'A signed PDF is generated and stored for both parties' },
              ].map((item) => (
                <div key={item.num} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal-700">{item.num}</span>
                  </div>
                  <p className="text-sm text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
            <Button onClick={() => navigate(`/tenancies/${tenancyId}/agreements`)}>
              View All Agreements
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
