import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTenancy } from '../../hooks/useTenancies'
import { useLandlord } from '../../hooks/useLandlord'
import { useCreateAgreement } from '../../hooks/useAgreements'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import {
  type AgreementFormData,
  type AgreementClause,
  getDefaultFormData,
  generateAgreementClauses,
  DEPOSIT_SCHEMES,
  FURNISHING_OPTIONS,
} from '../../lib/agreementTemplate'
import {
  type RoomLicenceFormData,
  getDefaultRoomLicenceData,
  generateRoomLicenceClauses,
} from '../../lib/roomLicenceTemplate'
import { downloadEditableAgreementPdf } from '../../lib/generateAgreementPdf'

type AgreementType = 'periodic_tenancy' | 'hmo_room_licence'
type Step = 'choose' | 'details' | 'edit' | 'done'

const STEPS: { key: Step; label: string }[] = [
  { key: 'choose', label: 'Choose Template' },
  { key: 'details', label: 'Agreement Details' },
  { key: 'edit', label: 'Edit Agreement' },
  { key: 'done', label: 'Download' },
]

export default function CreateAgreement() {
  const { tenancyId } = useParams<{ tenancyId: string }>()
  const [searchParams] = useSearchParams()
  const docType = (searchParams.get('type') || 'tenancy_agreement') as 'tenancy_agreement' | 'inventory'
  const navigate = useNavigate()
  const { data: tenancy } = useTenancy(tenancyId)
  const { data: landlord } = useLandlord()
  const createAgreement = useCreateAgreement()

  const [step, setStep] = useState<Step>('choose')
  const [agreementType, setAgreementType] = useState<AgreementType>('periodic_tenancy')
  const [error, setError] = useState('')

  // Form data for both types
  const [periodicData, setPeriodicData] = useState<AgreementFormData | null>(null)
  const [roomData, setRoomData] = useState<RoomLicenceFormData | null>(null)

  // Editable clauses
  const [editableClauses, setEditableClauses] = useState<AgreementClause[]>([])

  const property = (tenancy as any)?.properties
  const tenant = (tenancy as any)?.tenants

  // Check if property is HMO
  const isHmo = property?.property_type === 'HMO' || property?.property_type === 'hmo'

  // Initialise form data
  useEffect(() => {
    if (tenancy && landlord && property && tenant && !periodicData) {
      const address = [property.address_line1, property.address_line2, property.town, property.county]
        .filter(Boolean)
        .join(', ')

      setPeriodicData(
        getDefaultFormData(
          landlord.full_name,
          '',
          tenant.full_name,
          tenant.email || '',
          address,
          property.postcode || '',
          property.property_type || 'Residential dwelling',
          tenancy.start_date,
          tenancy.monthly_rent,
        ),
      )

      setRoomData(
        getDefaultRoomLicenceData(
          landlord.full_name,
          '',
          tenant.full_name,
          tenant.email || '',
          address,
          property.postcode || '',
          (tenancy as any).room_number || '',
          tenancy.start_date,
          tenancy.monthly_rent,
        ),
      )

      // Auto-select room licence if HMO
      if (isHmo) {
        setAgreementType('hmo_room_licence')
      }
    }
  }, [tenancy, landlord, property, tenant, periodicData, isHmo])

  // ── Field updaters ────────────────────────────────────────
  function updatePeriodicField<K extends keyof AgreementFormData>(key: K, value: AgreementFormData[K]) {
    setPeriodicData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function updateRoomField<K extends keyof RoomLicenceFormData>(key: K, value: RoomLicenceFormData[K]) {
    setRoomData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  // ── Clause editing ────────────────────────────────────────
  const updateClauseTitle = useCallback((index: number, title: string) => {
    setEditableClauses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], title }
      return next
    })
  }, [])

  const updateClauseText = useCallback((index: number, text: string) => {
    setEditableClauses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], text }
      return next
    })
  }, [])

  const updateSubclause = useCallback((clauseIdx: number, subIdx: number, text: string) => {
    setEditableClauses((prev) => {
      const next = [...prev]
      const subs = [...(next[clauseIdx].subclauses || [])]
      subs[subIdx] = text
      next[clauseIdx] = { ...next[clauseIdx], subclauses: subs }
      return next
    })
  }, [])

  const addSubclause = useCallback((clauseIdx: number) => {
    setEditableClauses((prev) => {
      const next = [...prev]
      const subs = [...(next[clauseIdx].subclauses || []), '']
      next[clauseIdx] = { ...next[clauseIdx], subclauses: subs }
      return next
    })
  }, [])

  const removeSubclause = useCallback((clauseIdx: number, subIdx: number) => {
    setEditableClauses((prev) => {
      const next = [...prev]
      const subs = (next[clauseIdx].subclauses || []).filter((_, i) => i !== subIdx)
      next[clauseIdx] = { ...next[clauseIdx], subclauses: subs.length ? subs : undefined }
      return next
    })
  }, [])

  const addClause = useCallback(() => {
    setEditableClauses((prev) => {
      const nextNum = String(prev.length + 1)
      return [...prev, { number: nextNum, title: 'New Clause', text: '', subclauses: [''] }]
    })
  }, [])

  const removeClause = useCallback((index: number) => {
    setEditableClauses((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      // Renumber
      return filtered.map((c, i) => ({ ...c, number: String(i + 1) }))
    })
  }, [])

  const moveClause = useCallback((index: number, direction: 'up' | 'down') => {
    setEditableClauses((prev) => {
      const next = [...prev]
      const swapIdx = direction === 'up' ? index - 1 : index + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
      // Renumber
      return next.map((c, i) => ({ ...c, number: String(i + 1) }))
    })
  }, [])

  // ── Validation ────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validateDetails(): boolean {
    const errors: Record<string, string> = {}

    if (agreementType === 'periodic_tenancy' && periodicData) {
      if (!periodicData.landlordName.trim()) errors.landlordName = 'Required'
      if (!periodicData.landlordAddress.trim()) errors.landlordAddress = 'Required'
      if (!periodicData.tenantName.trim()) errors.tenantName = 'Required'
      if (!periodicData.propertyAddress.trim()) errors.propertyAddress = 'Required'
      if (!periodicData.startDate) errors.startDate = 'Required'
      if (periodicData.monthlyRent <= 0) errors.monthlyRent = 'Must be greater than zero'
      if (periodicData.depositAmount <= 0) errors.depositAmount = 'Must be greater than zero'
      const fiveWeeks = Math.round(((periodicData.monthlyRent * 12) / 52) * 5 * 100) / 100
      if (periodicData.depositAmount > fiveWeeks + 0.01) {
        errors.depositAmount = `Cannot exceed 5 weeks' rent (£${fiveWeeks.toFixed(2)})`
      }
    } else if (roomData) {
      if (!roomData.landlordName.trim()) errors.landlordName = 'Required'
      if (!roomData.landlordAddress.trim()) errors.landlordAddress = 'Required'
      if (!roomData.tenantName.trim()) errors.tenantName = 'Required'
      if (!roomData.propertyAddress.trim()) errors.propertyAddress = 'Required'
      if (!roomData.startDate) errors.startDate = 'Required'
      if (roomData.monthlyRent <= 0) errors.monthlyRent = 'Must be greater than zero'
      if (roomData.depositAmount <= 0) errors.depositAmount = 'Must be greater than zero'
      if (!roomData.roomNumber.trim()) errors.roomNumber = 'Required for a room licence'
      const fiveWeeks = Math.round(((roomData.monthlyRent * 12) / 52) * 5 * 100) / 100
      if (roomData.depositAmount > fiveWeeks + 0.01) {
        errors.depositAmount = `Cannot exceed 5 weeks' rent (£${fiveWeeks.toFixed(2)})`
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Step Handlers ─────────────────────────────────────────
  const handleChooseTemplate = (type: AgreementType) => {
    setAgreementType(type)
    setStep('details')
    window.scrollTo(0, 0)
  }

  const handleContinueToEdit = () => {
    if (!validateDetails()) {
      setError('Please correct the highlighted fields before continuing.')
      return
    }
    setError('')
    setFieldErrors({})

    // Generate initial clauses from template
    if (agreementType === 'periodic_tenancy' && periodicData) {
      setEditableClauses(generateAgreementClauses(periodicData))
    } else if (roomData) {
      setEditableClauses(generateRoomLicenceClauses(roomData))
    }

    setStep('edit')
    window.scrollTo(0, 0)
  }

  const handleSaveAndDownload = async () => {
    if (!tenancyId) return
    setError('')

    const formData = agreementType === 'periodic_tenancy' ? periodicData : roomData
    if (!formData) return

    try {
      // Save to database
      await createAgreement.mutateAsync({
        tenancyId,
        type: docType,
        title: agreementType === 'hmo_room_licence'
          ? `HMO Room Licence — Room ${(roomData as RoomLicenceFormData).roomNumber}, ${formData.propertyPostcode}`
          : `Periodic Tenancy Agreement — ${formData.propertyPostcode}`,
        content: JSON.stringify({
          agreementType,
          formData,
          clauses: editableClauses,
        }),
      })

      // Download PDF
      downloadEditableAgreementPdf({
        title: agreementType === 'hmo_room_licence'
          ? 'HMO Room Licence Agreement'
          : 'Written Statement of Terms',
        subtitle: agreementType === 'hmo_room_licence'
          ? 'Licence to Occupy a Room in a House in Multiple Occupation'
          : 'for a Periodic Tenancy',
        landlordName: formData.landlordName,
        tenantName: formData.tenantName,
        propertyAddress: formData.propertyAddress,
        propertyPostcode: formData.propertyPostcode,
        monthlyRent: formData.monthlyRent,
        depositAmount: formData.depositAmount,
        startDate: formData.startDate,
        clauses: editableClauses,
        isRoomLicence: agreementType === 'hmo_room_licence',
        roomNumber: agreementType === 'hmo_room_licence' ? (roomData as RoomLicenceFormData).roomNumber : undefined,
      })

      setStep('done')
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agreement')
    }
  }

  const handleDownloadAgain = () => {
    const formData = agreementType === 'periodic_tenancy' ? periodicData : roomData
    if (!formData) return

    downloadEditableAgreementPdf({
      title: agreementType === 'hmo_room_licence'
        ? 'HMO Room Licence Agreement'
        : 'Written Statement of Terms',
      subtitle: agreementType === 'hmo_room_licence'
        ? 'Licence to Occupy a Room in a House in Multiple Occupation'
        : 'for a Periodic Tenancy',
      landlordName: formData.landlordName,
      tenantName: formData.tenantName,
      propertyAddress: formData.propertyAddress,
      propertyPostcode: formData.propertyPostcode,
      monthlyRent: formData.monthlyRent,
      depositAmount: formData.depositAmount,
      startDate: formData.startDate,
      clauses: editableClauses,
      isRoomLicence: agreementType === 'hmo_room_licence',
      roomNumber: agreementType === 'hmo_room_licence' ? (roomData as RoomLicenceFormData).roomNumber : undefined,
    })
  }

  // ── Loading ───────────────────────────────────────────────
  if (!tenancy || !landlord || !periodicData || !roomData) {
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

  // ── Step Progress ─────────────────────────────────────────
  const currentStepIdx = STEPS.findIndex((s) => s.key === step)

  const StepProgress = () => (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((s, idx) => {
        const isActive = idx === currentStepIdx
        const isComplete = idx < currentStepIdx
        return (
          <React.Fragment key={s.key}>
            {idx > 0 && (
              <div className={`flex-1 h-0.5 ${isComplete ? 'bg-teal-600' : 'bg-slate-200'}`} />
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
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-teal-700' : isComplete ? 'text-slate-600' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // STEP 1: CHOOSE TEMPLATE
  // ═══════════════════════════════════════════════════════════
  if (step === 'choose') {
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
          Choose the type of agreement for this tenancy. You'll be able to fully customise every clause before downloading.
        </p>

        <StepProgress />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          {/* Periodic Tenancy */}
          <button
            onClick={() => handleChooseTemplate('periodic_tenancy')}
            className="text-left p-6 rounded-xl border-2 border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Periodic Tenancy Agreement</h3>
            <p className="text-sm text-slate-500 mb-3">
              For standard buy-to-let properties. Creates an assured periodic tenancy compliant with the Renters' Rights Act 2025.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">BTL</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">Whole property</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">RRA 2025</span>
            </div>
          </button>

          {/* HMO Room Licence */}
          <button
            onClick={() => handleChooseTemplate('hmo_room_licence')}
            className="text-left p-6 rounded-xl border-2 border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">HMO Room Licence</h3>
            <p className="text-sm text-slate-500 mb-3">
              For individual rooms in a House in Multiple Occupation. Includes shared area rules, house rules, and HMO-specific clauses.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">HMO</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Individual room</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">House rules</span>
            </div>
          </button>
        </div>

        <div className="mt-5 pt-4">
          <Button variant="outline" onClick={() => navigate(`/tenancies/${tenancyId}/agreements`)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 2: DETAILS
  // ═══════════════════════════════════════════════════════════
  if (step === 'details') {
    const currentData = agreementType === 'periodic_tenancy' ? periodicData : roomData
    if (!currentData) return null
    const fiveWeeksRent = Math.round(((currentData.monthlyRent * 12) / 52) * 5 * 100) / 100

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
          {agreementType === 'hmo_room_licence' ? 'HMO Room Licence' : 'Periodic Tenancy Agreement'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Fill in the details below. These will be used to generate the agreement clauses, which you can then fully customise on the next step.
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
              <h2 className="text-sm font-semibold text-slate-900">Parties</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Landlord Name"
                  value={currentData.landlordName}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('landlordName', e.target.value)
                    : updateRoomField('landlordName', e.target.value)}
                  error={fieldErrors.landlordName}
                  required
                />
                <Input
                  label="Landlord Address"
                  value={currentData.landlordAddress}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('landlordAddress', e.target.value)
                    : updateRoomField('landlordAddress', e.target.value)}
                  error={fieldErrors.landlordAddress}
                  placeholder="Correspondence address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={agreementType === 'hmo_room_licence' ? 'Licensee Name' : 'Tenant Name'}
                  value={currentData.tenantName}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('tenantName', e.target.value)
                    : updateRoomField('tenantName', e.target.value)}
                  error={fieldErrors.tenantName}
                  required
                />
                <Input
                  label="Email"
                  value={currentData.tenantEmail}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('tenantEmail', e.target.value)
                    : updateRoomField('tenantEmail', e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Property / Room */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">
                {agreementType === 'hmo_room_licence' ? 'Property & Room' : 'Property'}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Property Address"
                  value={currentData.propertyAddress}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('propertyAddress', e.target.value)
                    : updateRoomField('propertyAddress', e.target.value)}
                  error={fieldErrors.propertyAddress}
                  required
                />
                <Input
                  label="Postcode"
                  value={currentData.propertyPostcode}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('propertyPostcode', e.target.value)
                    : updateRoomField('propertyPostcode', e.target.value)}
                  required
                />
              </div>

              {agreementType === 'hmo_room_licence' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Room Number / Name"
                    value={(roomData as RoomLicenceFormData).roomNumber}
                    onChange={(e) => updateRoomField('roomNumber', e.target.value)}
                    error={fieldErrors.roomNumber}
                    placeholder="e.g. Room 3, or Front Bedroom"
                    required
                  />
                  <Input
                    label="Room Description"
                    value={(roomData as RoomLicenceFormData).roomDescription}
                    onChange={(e) => updateRoomField('roomDescription', e.target.value)}
                    placeholder="e.g. First floor double bedroom"
                  />
                  <Input
                    label="HMO Licence Number"
                    value={(roomData as RoomLicenceFormData).hmoLicenceNumber}
                    onChange={(e) => updateRoomField('hmoLicenceNumber', e.target.value)}
                    placeholder="If known"
                  />
                </div>
              )}

              {agreementType === 'hmo_room_licence' && (
                <Input
                  label="Shared Areas"
                  value={(roomData as RoomLicenceFormData).sharedAreas}
                  onChange={(e) => updateRoomField('sharedAreas', e.target.value)}
                  placeholder="e.g. Kitchen, bathroom, living room"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Furnishing"
                  value={currentData.furnishing}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('furnishing', e.target.value as AgreementFormData['furnishing'])
                    : updateRoomField('furnishing', e.target.value as RoomLicenceFormData['furnishing'])}
                  options={FURNISHING_OPTIONS}
                />
                <Input
                  label="Permitted Occupants"
                  type="number"
                  min={1}
                  max={20}
                  value={currentData.permittedOccupants}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('permittedOccupants', parseInt(e.target.value) || 1)
                    : updateRoomField('permittedOccupants', parseInt(e.target.value) || 1)}
                />
                {agreementType === 'periodic_tenancy' && (
                  <Select
                    label="Garden Maintenance"
                    value={(periodicData as AgreementFormData).gardenMaintenance}
                    onChange={(e) => updatePeriodicField('gardenMaintenance', e.target.value as 'tenant' | 'landlord')}
                    options={[
                      { value: 'tenant', label: 'Tenant responsibility' },
                      { value: 'landlord', label: 'Landlord responsibility' },
                    ]}
                  />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Financial Terms</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={`Monthly ${agreementType === 'hmo_room_licence' ? 'Licence Fee' : 'Rent'} (£)`}
                  type="number"
                  min={0}
                  step={0.01}
                  value={currentData.monthlyRent}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('monthlyRent', parseFloat(e.target.value) || 0)
                    : updateRoomField('monthlyRent', parseFloat(e.target.value) || 0)}
                  error={fieldErrors.monthlyRent}
                  required
                />
                <Input
                  label="Commencement Date"
                  type="date"
                  value={currentData.startDate}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('startDate', e.target.value)
                    : updateRoomField('startDate', e.target.value)}
                  error={fieldErrors.startDate}
                  required
                />
                <Select
                  label="Payment Due Day"
                  value={String(currentData.rentDueDay)}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('rentDueDay', parseInt(e.target.value))
                    : updateRoomField('rentDueDay', parseInt(e.target.value))}
                  options={Array.from({ length: 28 }, (_, i) => ({
                    value: String(i + 1),
                    label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} of each month`,
                  }))}
                />
              </div>
              <Input
                label="Payment Method"
                value={currentData.paymentMethod}
                onChange={(e) => agreementType === 'periodic_tenancy'
                  ? updatePeriodicField('paymentMethod', e.target.value)
                  : updateRoomField('paymentMethod', e.target.value)}
                placeholder="e.g. Bank transfer, Standing order"
              />
              {agreementType === 'hmo_room_licence' && (
                <Input
                  label="Rent Includes"
                  value={(roomData as RoomLicenceFormData).rentIncludes}
                  onChange={(e) => updateRoomField('rentIncludes', e.target.value)}
                  placeholder="e.g. All bills included (gas, electric, water, council tax, broadband)"
                />
              )}
            </CardBody>
          </Card>

          {/* Deposit */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Deposit Protection</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  Under the Tenant Fees Act 2019, the deposit is capped at 5 weeks' rent. Max deposit: <strong>£{fiveWeeksRent.toFixed(2)}</strong>.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Deposit Amount (£)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={currentData.depositAmount}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('depositAmount', parseFloat(e.target.value) || 0)
                    : updateRoomField('depositAmount', parseFloat(e.target.value) || 0)}
                  error={fieldErrors.depositAmount}
                  helperText={`Max: £${fiveWeeksRent.toFixed(2)}`}
                  required
                />
                <Select
                  label="Deposit Scheme"
                  value={currentData.depositScheme}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('depositScheme', e.target.value as AgreementFormData['depositScheme'])
                    : updateRoomField('depositScheme', e.target.value as RoomLicenceFormData['depositScheme'])}
                  options={DEPOSIT_SCHEMES}
                />
                <Input
                  label="Deposit Reference"
                  value={currentData.depositReference}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('depositReference', e.target.value)
                    : updateRoomField('depositReference', e.target.value)}
                  placeholder="If known"
                />
              </div>
            </CardBody>
          </Card>

          {/* Additional */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Additional Options</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-6 flex-wrap">
                {agreementType === 'periodic_tenancy' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(periodicData as AgreementFormData).parkingIncluded}
                      onChange={(e) => updatePeriodicField('parkingIncluded', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    <span className="text-sm text-slate-700">Parking space included</span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentData.petsConsidered}
                    onChange={(e) => agreementType === 'periodic_tenancy'
                      ? updatePeriodicField('petsConsidered', e.target.checked)
                      : updateRoomField('petsConsidered', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-sm text-slate-700">Open to pet requests</span>
                </label>
                <Select
                  label="Council Tax"
                  value={currentData.councilTaxResponsibility}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('councilTaxResponsibility', e.target.value as 'tenant' | 'landlord')
                    : updateRoomField('councilTaxResponsibility', e.target.value as 'tenant' | 'landlord')}
                  options={[
                    { value: 'tenant', label: 'Tenant pays' },
                    { value: 'landlord', label: 'Landlord pays' },
                  ]}
                />
                <Select
                  label="Utilities"
                  value={currentData.utilitiesResponsibility}
                  onChange={(e) => agreementType === 'periodic_tenancy'
                    ? updatePeriodicField('utilitiesResponsibility', e.target.value as 'tenant' | 'landlord')
                    : updateRoomField('utilitiesResponsibility', e.target.value as 'tenant' | 'landlord')}
                  options={[
                    { value: 'tenant', label: 'Tenant pays' },
                    { value: 'landlord', label: 'Landlord pays' },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <Button variant="outline" onClick={() => { setStep('choose'); window.scrollTo(0, 0) }}>
              Back
            </Button>
            <Button onClick={handleContinueToEdit}>Generate Agreement</Button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3: EDIT AGREEMENT (Full clause editor)
  // ═══════════════════════════════════════════════════════════
  if (step === 'edit') {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Tenancies', href: '/tenancies' },
            { label: property ? property.address_line1 : 'Tenancy', href: `/tenancies/${tenancyId}` },
            { label: 'Agreements', href: `/tenancies/${tenancyId}/agreements` },
            { label: 'Edit Agreement' },
          ]}
        />

        <h1 className="text-2xl font-fraunces font-semibold text-slate-900 mb-2">
          Edit Agreement
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Every clause is fully editable. Add, remove, reorder, or rewrite any part of the agreement. When you're happy, save and download the PDF.
        </p>

        <StepProgress />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3 items-start">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-800">
            This agreement has been generated from the {agreementType === 'hmo_room_licence' ? 'HMO Room Licence' : 'Periodic Tenancy'} template. You can edit every clause title, body text, and sub-clause. Use the buttons to add, remove, or reorder clauses. The PDF will be generated exactly as shown here.
          </p>
        </div>

        {/* Clause Editor */}
        <div className="space-y-4 mb-6">
          {editableClauses.map((clause, clauseIdx) => (
            <Card key={clauseIdx} className="border-l-4 border-l-teal-600">
              <CardBody className="p-5">
                {/* Clause header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{clause.number}</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={clause.title}
                      onChange={(e) => updateClauseTitle(clauseIdx, e.target.value)}
                      className="w-full text-sm font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none bg-transparent pb-1 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveClause(clauseIdx, 'up')}
                      disabled={clauseIdx === 0}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveClause(clauseIdx, 'down')}
                      disabled={clauseIdx === editableClauses.length - 1}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeClause(clauseIdx)}
                      className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Remove clause"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {/* Clause intro text */}
                {clause.text !== undefined && (
                  <div className="ml-11 mb-3">
                    <textarea
                      value={clause.text}
                      onChange={(e) => updateClauseText(clauseIdx, e.target.value)}
                      placeholder="Introductory text for this clause (optional)"
                      rows={2}
                      className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 resize-y"
                    />
                  </div>
                )}

                {/* Subclauses */}
                {clause.subclauses && clause.subclauses.length > 0 && (
                  <div className="space-y-2 ml-11">
                    {clause.subclauses.map((sub, subIdx) => (
                      <div key={subIdx} className="flex gap-2 items-start group">
                        <span className="text-xs font-mono text-teal-600 flex-shrink-0 pt-2.5 w-8">
                          {clause.number}.{subIdx + 1}
                        </span>
                        <textarea
                          value={sub}
                          onChange={(e) => updateSubclause(clauseIdx, subIdx, e.target.value)}
                          rows={2}
                          className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 resize-y leading-relaxed"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubclause(clauseIdx, subIdx)}
                          className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5"
                          title="Remove sub-clause"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add sub-clause button */}
                <div className="ml-11 mt-2">
                  <button
                    type="button"
                    onClick={() => addSubclause(clauseIdx)}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add sub-clause
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Add clause button */}
        <button
          type="button"
          onClick={addClause}
          className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:text-teal-700 hover:border-teal-600 hover:bg-teal-50/50 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Add New Clause
        </button>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <Button
            variant="outline"
            onClick={() => { setStep('details'); window.scrollTo(0, 0) }}
          >
            Back to Details
          </Button>
          <Button onClick={handleSaveAndDownload} loading={createAgreement.isPending}>
            Save & Download PDF
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
          { label: 'Agreement Saved' },
        ]}
      />

      <StepProgress />

      <Card>
        <CardBody className="p-8 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="h-8 w-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>

          <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-2">
            Agreement Saved & Downloaded
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Your {agreementType === 'hmo_room_licence' ? 'HMO Room Licence' : 'Periodic Tenancy Agreement'} has been saved and the PDF has been downloaded. Print it for signing by both parties.
          </p>

          <div className="bg-slate-50 rounded-lg p-5 mb-6 text-left max-w-lg mx-auto">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Next steps</h3>
            <div className="space-y-3">
              {[
                { num: '1', text: 'Print two copies of the agreement' },
                { num: '2', text: `Both you and ${(agreementType === 'periodic_tenancy' ? periodicData : roomData)?.tenantName} sign both copies` },
                { num: '3', text: 'Each party keeps a signed copy' },
                { num: '4', text: 'Upload the signed copy to the tenant\'s documents for your records' },
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
            <Button variant="outline" onClick={handleDownloadAgain}>
              Download PDF Again
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
