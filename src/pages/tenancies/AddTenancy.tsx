import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export default function AddTenancy() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Property address fields (inline entry)
  const [addressData, setAddressData] = useState({
    address_line1: '',
    address_line2: '',
    town: '',
    county: '',
    postcode: '',
    property_type: '',
    is_hmo: false,
  })

  // Tenancy fields
  const [formData, setFormData] = useState({
    tenancy_type: 'periodic',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    rent_due_day: '1',
    deposit_amount: '',
    deposit_scheme: '',
    deposit_scheme_ref: '',
  })

  // Tenant selection
  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState<Array<{ id: string; full_name: string; email: string }>>([])

  // Ownership
  const [ownership, setOwnership] = useState<'individual' | 'company'>('individual')
  const [companyData, setCompanyData] = useState({
    name: '',
    company_number: '',
    registered_address: '',
  })

  // EPC
  const [epcLoading, setEpcLoading] = useState(false)
  const [epcResults, setEpcResults] = useState<any[]>([])
  const [epcData, setEpcData] = useState<{
    epc_rating: string
    epc_score: number | null
    epc_expiry: string
  } | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      try {
        const { data: tenantsData } = await supabase
          .from('tenants')
          .select('id, full_name, email')
        setTenants(tenantsData || [])
      } catch (err) {
        console.error('Error loading tenants:', err)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [user])

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setAddressData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setAddressData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEpcLookup = async () => {
    if (!addressData.postcode) {
      setError('Enter a postcode first')
      return
    }
    setEpcLoading(true)
    setError(null)
    setEpcResults([])
    setEpcData(null)
    try {
      const res = await fetch(`/api/epc-lookup?postcode=${encodeURIComponent(addressData.postcode)}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.results && data.results.length > 0) {
        setEpcResults(data.results)
      } else {
        setError('No EPC records found for this postcode')
      }
    } catch (err) {
      setError('Failed to look up EPC data')
    } finally {
      setEpcLoading(false)
    }
  }

  const selectEpc = (epc: any) => {
    setEpcData({
      epc_rating: epc.current_rating || '',
      epc_score: epc.current_score ? parseInt(epc.current_score) : null,
      epc_expiry: epc.expiry_date || '',
    })
    // Auto-fill address from selected EPC if address_line1 is empty
    if (!addressData.address_line1 && epc.address) {
      const parts = epc.address.split(',').map((p: string) => p.trim())
      setAddressData((prev) => ({
        ...prev,
        address_line1: parts[0] || prev.address_line1,
        address_line2: parts.length > 2 ? parts[1] : prev.address_line2,
        town: parts[parts.length - 1] || prev.town,
        property_type: epc.property_type?.toLowerCase() || prev.property_type,
      }))
    }
    setEpcResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in')
      return
    }

    if (!addressData.address_line1 || !addressData.town || !addressData.postcode) {
      setError('Property address, town, and postcode are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get or create landlord record
      let { data: landlord } = await supabase
        .from('landlords')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!landlord) {
        const { data: newLandlord, error: landlordError } = await supabase
          .from('landlords')
          .insert({
            auth_user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
          })
          .select()
          .single()

        if (landlordError) throw landlordError
        landlord = newLandlord
      }

      if (!landlord) throw new Error('Landlord not found')

      let legal_entity_id: string | null = null

      // Create legal entity if company
      if (ownership === 'company') {
        if (!companyData.name || !companyData.company_number) {
          setError('Company name and number are required')
          setLoading(false)
          return
        }

        const { data: entity, error: entityError } = await supabase
          .from('legal_entities')
          .insert({
            landlord_id: landlord.id,
            name: companyData.name,
            company_number: companyData.company_number,
            registered_address: companyData.registered_address,
            is_company: true,
          })
          .select()
          .single()

        if (entityError) throw entityError
        legal_entity_id = entity.id
      }

      // Create property from inline address
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          landlord_id: landlord.id,
          legal_entity_id,
          address_line1: addressData.address_line1,
          address_line2: addressData.address_line2,
          town: addressData.town,
          county: addressData.county,
          postcode: addressData.postcode,
          property_type: addressData.property_type,
          is_hmo: addressData.is_hmo,
          ...(epcData
            ? {
                epc_rating: epcData.epc_rating,
                epc_score: epcData.epc_score,
                epc_expiry: epcData.epc_expiry,
              }
            : {}),
        })
        .select()
        .single()

      if (propertyError) throw propertyError

      // Create tenancy linked to the new property
      const { error: tenancyError } = await supabase
        .from('tenancies')
        .insert({
          landlord_id: landlord.id,
          property_id: property.id,
          unit_id: null,
          legal_entity_id,
          tenancy_type: formData.tenancy_type,
          start_date: formData.start_date,
          end_date: formData.tenancy_type === 'fixed' ? formData.end_date : null,
          monthly_rent: parseFloat(formData.monthly_rent),
          rent_due_day: parseInt(formData.rent_due_day),
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
          deposit_scheme: formData.deposit_scheme || null,
          deposit_scheme_ref: formData.deposit_scheme_ref || null,
        })

      if (tenancyError) throw tenancyError

      navigate('/tenancies')
    } catch (err) {
      console.error('Error creating tenancy:', err)
      setError(err instanceof Error ? err.message : 'Failed to create tenancy')
    } finally {
      setLoading(false)
    }
  }

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'flat', label: 'Flat' },
    { value: 'bungalow', label: 'Bungalow' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'hmo', label: 'HMO' },
  ]

  const tenancyTypes = [
    { value: 'periodic', label: 'Periodic' },
    { value: 'fixed', label: 'Fixed Term' },
  ]

  const depositSchemes = [
    { value: 'DPS', label: 'DPS' },
    { value: 'TDS', label: 'TDS' },
    { value: 'MyDeposits', label: 'MyDeposits' },
  ]

  if (loadingData) {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: 'Tenancies', href: '/tenancies' },
            { label: 'Add Tenancy' },
          ]}
        />
        <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
          Add New Tenancy
        </h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          { label: 'Add Tenancy' },
        ]}
      />

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Add New Tenancy
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Property Address
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-600 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {/* Property Address Section */}
            <Input
              label="Address Line 1"
              name="address_line1"
              value={addressData.address_line1}
              onChange={handleAddressChange}
              placeholder="Street address"
              required
            />
            <Input
              label="Address Line 2"
              name="address_line2"
              value={addressData.address_line2}
              onChange={handleAddressChange}
              placeholder="Apartment, suite, etc. (optional)"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Town"
                name="town"
                value={addressData.town}
                onChange={handleAddressChange}
                placeholder="Town"
                required
              />
              <Input
                label="County"
                name="county"
                value={addressData.county}
                onChange={handleAddressChange}
                placeholder="County"
              />
            </div>
            <Input
              label="Postcode"
              name="postcode"
              value={addressData.postcode}
              onChange={handleAddressChange}
              placeholder="Postcode"
              required
            />
            <Select
              label="Property Type"
              name="property_type"
              value={addressData.property_type}
              onChange={handleAddressChange}
              options={propertyTypes}
              required
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_hmo"
                checked={addressData.is_hmo}
                onChange={handleAddressChange}
                className="w-4 h-4 rounded border-slate-200"
              />
              <label className="ml-2 text-sm font-medium text-slate-900">
                Is this an HMO (House in Multiple Occupation)?
              </label>
            </div>

            {/* EPC Lookup Section */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">EPC Data</h3>
              <div className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-2">
                    Look up the latest EPC certificate using the postcode above.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  loading={epcLoading}
                  onClick={handleEpcLookup}
                >
                  Lookup EPC
                </Button>
              </div>

              {epcResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-900 mb-2">
                    Select the matching property ({epcResults.length} results):
                  </p>
                  {epcResults.map((epc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectEpc(epc)}
                      className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900">{epc.address}</p>
                      <div className="flex gap-4 mt-1 text-xs text-slate-400">
                        <span>Rating: <strong className="text-slate-900">{epc.current_rating}</strong></span>
                        <span>Score: {epc.current_score}</span>
                        <span>Expires: {epc.expiry_date}</span>
                        <span>Type: {epc.property_type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {epcData && (
                <div className="p-4 bg-green-50 border border-green-600 rounded-lg mt-3">
                  <p className="text-sm font-medium text-green-600 mb-2">EPC data selected:</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-green-600">
                    <div>
                      <span className="font-medium">Rating:</span> {epcData.epc_rating}
                    </div>
                    <div>
                      <span className="font-medium">Score:</span> {epcData.epc_score}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {epcData.epc_expiry}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ownership Section */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ownership</h3>
              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ownership"
                    value="individual"
                    checked={ownership === 'individual'}
                    onChange={() => setOwnership('individual')}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-900">Individual</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ownership"
                    value="company"
                    checked={ownership === 'company'}
                    onChange={() => setOwnership('company')}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-900">Limited Company</span>
                </label>
              </div>

              {ownership === 'company' && (
                <div className="space-y-4 p-4 bg-slate-100 rounded-lg">
                  <Input
                    label="Company Name"
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyChange}
                    placeholder="e.g., Acme Ltd"
                    required
                  />
                  <Input
                    label="Company Number"
                    name="company_number"
                    value={companyData.company_number}
                    onChange={handleCompanyChange}
                    placeholder="e.g., 12345678"
                    required
                  />
                  <Input
                    label="Registered Address"
                    name="registered_address"
                    value={companyData.registered_address}
                    onChange={handleCompanyChange}
                    placeholder="Company registered address"
                  />
                </div>
              )}
            </div>

            {/* Tenant Selection */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tenant</h3>
              {tenants.length > 0 ? (
                <Select
                  label="Select Tenant"
                  name="tenant_id"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  options={tenants.map((t) => ({
                    value: t.id,
                    label: `${t.full_name} (${t.email})`,
                  }))}
                />
              ) : (
                <p className="text-sm text-slate-600">
                  No tenants yet.{' '}
                  <a href="/tenants/invite" className="text-blue-600 hover:underline">
                    Invite a tenant
                  </a>{' '}
                  first, or you can add a tenant after creating this tenancy.
                </p>
              )}
            </div>

            {/* Tenancy Details Section */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tenancy Details</h3>

              <div className="space-y-6">
                <Select
                  label="Tenancy Type"
                  name="tenancy_type"
                  value={formData.tenancy_type}
                  onChange={handleChange}
                  options={tenancyTypes}
                  required
                />

                <Input
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />

                {formData.tenancy_type === 'fixed' && (
                  <Input
                    label="End Date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                )}

                <Input
                  label="Monthly Rent (£)"
                  name="monthly_rent"
                  type="number"
                  step="0.01"
                  value={formData.monthly_rent}
                  onChange={handleChange}
                  placeholder="Enter monthly rent"
                  required
                />

                <Input
                  label="Rent Due Day (1-28)"
                  name="rent_due_day"
                  type="number"
                  min="1"
                  max="28"
                  value={formData.rent_due_day}
                  onChange={handleChange}
                />

                <Input
                  label="Deposit Amount (£)"
                  name="deposit_amount"
                  type="number"
                  step="0.01"
                  value={formData.deposit_amount}
                  onChange={handleChange}
                  placeholder="Optional"
                />

                <Select
                  label="Deposit Scheme"
                  name="deposit_scheme"
                  value={formData.deposit_scheme}
                  onChange={handleChange}
                  options={depositSchemes}
                />

                {formData.deposit_scheme && (
                  <Input
                    label="Deposit Scheme Reference"
                    name="deposit_scheme_ref"
                    value={formData.deposit_scheme_ref}
                    onChange={handleChange}
                    placeholder="e.g., scheme reference number"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" loading={loading}>
                Create Tenancy
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tenancies')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
