import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { formatDate } from '../../lib/utils'

export default function AddProperty() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    address_line1: '',
    address_line2: '',
    town: '',
    county: '',
    postcode: '',
    property_type: '',
    is_hmo: false,
  })
  const [ownership, setOwnership] = useState<'individual' | 'company'>('individual')
  const [companyMode, setCompanyMode] = useState<'existing' | 'new'>('existing')
  const [selectedEntityId, setSelectedEntityId] = useState('')
  const [existingEntities, setExistingEntities] = useState<Array<{ id: string; name: string; company_number: string }>>([])
  const [companyData, setCompanyData] = useState({
    name: '',
    company_number: '',
    registered_address: '',
  })
  // HMO rooms
  const [hmoRoomCount, setHmoRoomCount] = useState('')
  const [hmoRoomLabels, setHmoRoomLabels] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [epcLoading, setEpcLoading] = useState(false)
  const [epcResults, setEpcResults] = useState<any[]>([])
  const [epcData, setEpcData] = useState<{
    epc_rating: string
    epc_score: number | null
    epc_expiry: string
    lmk_key: string | null
  } | null>(null)

  // Load existing legal entities
  useEffect(() => {
    const loadEntities = async () => {
      if (!user) return
      try {
        const { data: landlord } = await supabase
          .from('landlords')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        if (!landlord) return

        const { data: entities } = await supabase
          .from('legal_entities')
          .select('id, name, company_number')
          .eq('landlord_id', landlord.id)
          .eq('is_company', true)
          .order('name')

        setExistingEntities(entities || [])
        if (entities && entities.length > 0) {
          setCompanyMode('existing')
        }
      } catch (err) {
        console.error('Error loading entities:', err)
      }
    }
    loadEntities()
  }, [user])

  const isHmo = formData.is_hmo || formData.property_type === 'hmo'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Auto-sync: if is_hmo checked, set property_type to hmo too
        ...(name === 'is_hmo' && checked && !prev.property_type ? { property_type: 'hmo' } : {}),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // Auto-sync: if property_type set to hmo, tick is_hmo
        ...(name === 'property_type' && value === 'hmo' ? { is_hmo: true } : {}),
        ...(name === 'property_type' && value !== 'hmo' ? { is_hmo: false } : {}),
      }))
    }
  }

  const handleRoomCountChange = (value: string) => {
    setHmoRoomCount(value)
    const count = parseInt(value)
    if (!isNaN(count) && count > 0 && count <= 50) {
      // Preserve existing labels, extend or trim
      setHmoRoomLabels((prev) => {
        const newLabels = [...prev]
        while (newLabels.length < count) {
          newLabels.push(`Room ${newLabels.length + 1}`)
        }
        return newLabels.slice(0, count)
      })
    }
  }

  const updateRoomLabel = (index: number, label: string) => {
    setHmoRoomLabels((prev) => {
      const updated = [...prev]
      updated[index] = label
      return updated
    })
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEpcLookup = async () => {
    if (!formData.postcode) {
      setError('Enter a postcode first')
      return
    }
    setEpcLoading(true)
    setError(null)
    setEpcResults([])
    setEpcData(null)
    try {
      const res = await fetch(`/api/epc-lookup?postcode=${encodeURIComponent(formData.postcode)}`)
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
      lmk_key: epc.lmk_key || null,
    })
    if (!formData.address_line1 && epc.address) {
      const parts = epc.address.split(',').map((p: string) => p.trim())
      setFormData((prev) => ({
        ...prev,
        address_line1: parts[0] || prev.address_line1,
        address_line2: parts.length > 2 ? parts[1] : prev.address_line2,
        town: parts[parts.length - 1] || prev.town,
      }))
    }
    setEpcResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to add a property')
      return
    }

    setLoading(true)
    setError(null)

    try {
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

      if (ownership === 'company') {
        if (companyMode === 'existing' && selectedEntityId) {
          legal_entity_id = selectedEntityId
        } else if (companyMode === 'new') {
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
              registered_address: companyData.registered_address || null,
              is_company: true,
            })
            .select()
            .single()

          if (entityError) throw entityError
          legal_entity_id = entity.id
        }
      }

      const propertyPayload = {
        landlord_id: landlord.id,
        legal_entity_id,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        town: formData.town,
        county: formData.county || null,
        postcode: formData.postcode,
        property_type: formData.property_type || null,
        is_hmo: formData.is_hmo,
        ...(epcData ? {
          epc_rating: epcData.epc_rating || null,
          epc_score: epcData.epc_score,
          epc_expiry: epcData.epc_expiry || null,
          uprn: epcData.lmk_key || null,
        } : {}),
      }

      console.log('Creating property with:', propertyPayload)
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyPayload)
        .select()
        .single()

      if (propertyError) {
        console.error('Property creation failed:', propertyError)
        throw new Error(`Property creation failed: ${propertyError.message} (${propertyError.code})`)
      }

      // Create HMO rooms if applicable
      if (isHmo && hmoRoomLabels.length > 0 && property) {
        const roomRows = hmoRoomLabels
          .filter((label) => label.trim())
          .map((label) => ({
            property_id: property.id,
            room_label: label.trim(),
          }))

        if (roomRows.length > 0) {
          const { error: roomsError } = await supabase
            .from('property_rooms')
            .insert(roomRows)
          if (roomsError) {
            console.warn('Failed to create HMO rooms:', roomsError)
          }
        }
      }

      // Auto-create EPC document record
      if (epcData && epcData.lmk_key && property) {
        const epcCertUrl = `https://find-energy-certificate.service.gov.uk/energy-certificate/${epcData.lmk_key}`
        try {
          await supabase.from('documents').insert({
            landlord_id: landlord.id,
            scope: 'property',
            property_id: property.id,
            tenancy_id: null,
            document_type: 'epc',
            title: `EPC Certificate — Rating ${epcData.epc_rating}${epcData.epc_score ? ` (${epcData.epc_score})` : ''}`,
            description: `Auto-imported from gov.uk EPC register. Valid to ${formatDate(epcData.epc_expiry)}.`,
            file_path: epcCertUrl,
            file_name: `epc-certificate-${epcData.lmk_key}.pdf`,
            file_size: 0,
            mime_type: 'text/html',
            valid_from: null,
            valid_to: epcData.epc_expiry || null,
            uploaded_by: user.id,
          })
        } catch (docErr) {
          console.warn('Failed to auto-create EPC document:', docErr)
        }
      }

      navigate('/properties')
    } catch (err) {
      console.error('Error creating property:', err)
      setError(err instanceof Error ? err.message : 'Failed to create property')
    } finally {
      setLoading(false)
    }
  }

  const propertyTypes = [
    { value: 'btl', label: 'Buy to Let' },
    { value: 'hmo', label: 'HMO' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'holiday_let', label: 'Holiday Let' },
  ]

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Properties', href: '/properties' },
          { label: 'Add Property' },
        ]}
      />

      <h1 className="text-3xl font-fraunces font-semibold text-slate-900 mb-8">
        Add New Property
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Property Address
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Address Line 1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="Street address"
              required
            />
            <Input
              label="Address Line 2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Town"
                name="town"
                value={formData.town}
                onChange={handleChange}
                placeholder="Town"
                required
              />
              <Input
                label="County"
                name="county"
                value={formData.county}
                onChange={handleChange}
                placeholder="County"
              />
            </div>
            <Input
              label="Postcode"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              placeholder="Postcode"
              required
            />
            <Select
              label="Property Type"
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              options={propertyTypes}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_hmo"
                checked={formData.is_hmo}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-200"
              />
              <label className="ml-2 text-sm font-medium text-slate-700">
                Is this an HMO (House in Multiple Occupation)?
              </label>
            </div>

            {/* HMO Rooms — shown when HMO is selected */}
            {isHmo && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">HMO Room Setup</p>
                  <p className="text-xs text-amber-600">
                    How many lettable rooms does this HMO have? You can name each room (e.g., Room 1, The Attic, B2).
                  </p>
                </div>
                <Input
                  label="Number of Let Rooms"
                  type="number"
                  min="1"
                  max="50"
                  value={hmoRoomCount}
                  onChange={(e) => handleRoomCountChange(e.target.value)}
                  placeholder="e.g., 5"
                />
                {hmoRoomLabels.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">
                      Room names / numbers
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {hmoRoomLabels.map((label, i) => (
                        <input
                          key={i}
                          type="text"
                          value={label}
                          onChange={(e) => updateRoomLabel(i, e.target.value)}
                          className="px-3 py-2 rounded-md border border-amber-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                          placeholder={`Room ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EPC Lookup */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                EPC Data
              </h3>
              <div className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-500">
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
                <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-100 rounded-xl p-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Select the matching property ({epcResults.length} results):
                  </p>
                  {epcResults.map((epc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectEpc(epc)}
                      className="w-full text-left p-4 border border-slate-100 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900">{epc.address}</p>
                      <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                        <span>Rating: <strong className="text-slate-700">{epc.current_rating}</strong></span>
                        <span>Score: {epc.current_score}</span>
                        <span>Expires: {epc.expiry_date ? new Date(epc.expiry_date).toLocaleDateString('en-GB') : '—'}</span>
                        <span>Type: {epc.property_type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {epcData && (
                <div className="p-5 bg-teal-50 border border-teal-100 rounded-xl mt-3">
                  <p className="text-sm font-medium text-teal-800 mb-3">EPC data selected:</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-teal-700">
                    <div>
                      <span className="text-xs text-teal-600 block mb-0.5">Rating</span>
                      <span className="font-semibold text-lg">{epcData.epc_rating}</span>
                    </div>
                    <div>
                      <span className="text-xs text-teal-600 block mb-0.5">Score</span>
                      <span className="font-semibold text-lg">{epcData.epc_score}</span>
                    </div>
                    <div>
                      <span className="text-xs text-teal-600 block mb-0.5">Expires</span>
                      <span className="font-medium">{formatDate(epcData.epc_expiry)}</span>
                    </div>
                  </div>
                  {epcData.lmk_key && (
                    <div className="mt-3 pt-3 border-t border-teal-200 flex items-center gap-3">
                      <a
                        href={`https://find-energy-certificate.service.gov.uk/energy-certificate/${epcData.lmk_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-teal-700 hover:text-teal-800 underline"
                      >
                        View Full EPC Certificate
                      </a>
                      <span className="text-xs text-teal-500">
                        Certificate will be saved to documents automatically
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ownership Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                Ownership
              </h3>

              <div className="space-y-3 mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="ownership"
                    value="individual"
                    checked={ownership === 'individual'}
                    onChange={() => setOwnership('individual')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="ml-2.5 text-sm font-medium text-slate-700">
                    Individual
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="ownership"
                    value="company"
                    checked={ownership === 'company'}
                    onChange={() => setOwnership('company')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="ml-2.5 text-sm font-medium text-slate-700">
                    Limited Company
                  </span>
                </label>
              </div>

              {ownership === 'company' && (
                <div className="p-5 bg-slate-50 rounded-xl space-y-5">
                  {existingEntities.length > 0 && (
                    <div className="space-y-3 mb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="companyMode"
                          value="existing"
                          checked={companyMode === 'existing'}
                          onChange={() => setCompanyMode('existing')}
                          className="w-4 h-4 text-teal-600"
                        />
                        <span className="ml-2.5 text-sm font-medium text-slate-700">
                          Select existing company
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="companyMode"
                          value="new"
                          checked={companyMode === 'new'}
                          onChange={() => setCompanyMode('new')}
                          className="w-4 h-4 text-teal-600"
                        />
                        <span className="ml-2.5 text-sm font-medium text-slate-700">
                          Add new company
                        </span>
                      </label>
                    </div>
                  )}

                  {companyMode === 'existing' && existingEntities.length > 0 ? (
                    <Select
                      label="Select Company"
                      name="entity_id"
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      options={existingEntities.map((e) => ({
                        value: e.id,
                        label: `${e.name} (${e.company_number})`,
                      }))}
                      required
                    />
                  ) : (
                    <div className="space-y-4">
                      <Input
                        label="Company Name"
                        name="name"
                        value={companyData.name}
                        onChange={handleCompanyChange}
                        placeholder="e.g., Acme Properties Ltd"
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
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" loading={loading}>
                Create Property
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/properties')}
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
