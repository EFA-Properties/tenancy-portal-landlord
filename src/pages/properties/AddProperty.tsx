import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

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
  const [companyData, setCompanyData] = useState({
    name: '',
    company_number: '',
    registered_address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [epcLoading, setEpcLoading] = useState(false)
  const [epcResults, setEpcResults] = useState<any[]>([])
  const [epcData, setEpcData] = useState<{
    epc_rating: string
    epc_score: number | null
    epc_expiry: string
  } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
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
    })
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

      let legal_entity_id: string | null = null

      if (!landlord) throw new Error('Landlord not found')

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

      // Create property
      const { error: propertyError } = await supabase
        .from('properties')
        .insert({
          landlord_id: landlord.id,
          legal_entity_id,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          town: formData.town,
          county: formData.county,
          postcode: formData.postcode,
          property_type: formData.property_type,
          is_hmo: formData.is_hmo,
          ...(epcData ? {
            epc_rating: epcData.epc_rating,
            epc_score: epcData.epc_score,
            epc_expiry: epcData.epc_expiry,
          } : {}),
        })

      if (propertyError) throw propertyError

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

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Add New Property
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Property Information
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-600 rounded-lg text-red-600">
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
              required
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_hmo"
                checked={formData.is_hmo}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-200"
              />
              <label className="ml-2 text-sm font-medium text-slate-900">
                Is this an HMO (House in Multiple Occupation)?
              </label>
            </div>

            {/* EPC Lookup Section */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">EPC Data</h3>
              <div className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-2">
                    Look up the latest EPC certificate for this property using the postcode above.
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
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ownership</h3>

              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ownership"
                    value="individual"
                    checked={ownership === 'individual'}
                    onChange={(e) => setOwnership('individual')}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-900">
                    Individual
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ownership"
                    value="company"
                    checked={ownership === 'company'}
                    onChange={(e) => setOwnership('company')}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-900">
                    Limited Company
                  </span>
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
