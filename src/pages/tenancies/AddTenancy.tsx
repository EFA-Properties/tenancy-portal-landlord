import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useProperties } from '../../hooks/useProperties'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Property } from '../../types/database'

interface PropertyRoom {
  id: string
  room_label: string
  floor: number | null
  notes: string | null
}

export default function AddTenancy() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()

  // Property selection
  const [propertyId, setPropertyId] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<(Property & { legal_entities: any }) | null>(null)

  // HMO rooms
  const [rooms, setRooms] = useState<PropertyRoom[]>([])
  const [roomId, setRoomId] = useState('')
  const [roomsLoading, setRoomsLoading] = useState(false)

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

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingTenants, setLoadingTenants] = useState(true)

  // Load tenants
  useEffect(() => {
    const loadTenants = async () => {
      if (!user) return
      try {
        const { data: tenantsData } = await supabase
          .from('tenants')
          .select('id, full_name, email')
        setTenants(tenantsData || [])
      } catch (err) {
        console.error('Error loading tenants:', err)
      } finally {
        setLoadingTenants(false)
      }
    }
    loadTenants()
  }, [user])

  // When property selection changes, update selected property and load rooms if HMO
  useEffect(() => {
    if (!propertyId) {
      setSelectedProperty(null)
      setRooms([])
      setRoomId('')
      return
    }

    const prop = properties.find((p) => p.id === propertyId) || null
    setSelectedProperty(prop)
    setRoomId('')

    if (prop && (prop.is_hmo || prop.property_type === 'hmo')) {
      loadRooms(propertyId)
    } else {
      setRooms([])
    }
  }, [propertyId, properties])

  const loadRooms = async (propId: string) => {
    setRoomsLoading(true)
    try {
      const { data, error: roomsError } = await supabase
        .from('property_rooms')
        .select('id, room_label, floor, notes')
        .eq('property_id', propId)
        .order('room_label')

      if (roomsError) throw roomsError
      setRooms(data || [])
    } catch (err) {
      console.error('Error loading rooms:', err)
    } finally {
      setRoomsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const isHmo = selectedProperty
    ? selectedProperty.is_hmo || selectedProperty.property_type === 'hmo'
    : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in')
      return
    }

    if (!propertyId) {
      setError('Please select a property')
      return
    }

    if (!formData.start_date) {
      setError('Start date is required')
      return
    }

    if (!formData.monthly_rent) {
      setError('Monthly rent is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get landlord record
      const { data: landlord } = await supabase
        .from('landlords')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!landlord) throw new Error('Landlord record not found')

      // Create tenancy linked to the selected property
      const tenancyPayload = {
        landlord_id: landlord.id,
        property_id: propertyId,
        tenant_id: tenantId || null,
        unit_id: null,
        legal_entity_id: selectedProperty?.legal_entity_id || null,
        tenancy_type: formData.tenancy_type,
        start_date: formData.start_date,
        end_date: formData.tenancy_type === 'fixed_term' ? formData.end_date : null,
        monthly_rent: parseFloat(formData.monthly_rent),
        rent_due_day: parseInt(formData.rent_due_day),
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        deposit_scheme: formData.deposit_scheme || null,
        deposit_scheme_ref: formData.deposit_scheme_ref || null,
      }

      const { data: tenancy, error: tenancyError } = await supabase
        .from('tenancies')
        .insert(tenancyPayload)
        .select()
        .single()

      if (tenancyError) throw new Error(`Tenancy creation failed: ${tenancyError.message}`)

      // If tenant was selected, also create the tenancy_tenants link (with room if HMO)
      if (tenantId && tenancy) {
        const linkPayload: Record<string, any> = {
          tenancy_id: tenancy.id,
          tenant_id: tenantId,
          status: 'active',
        }
        if (isHmo && roomId) {
          linkPayload.room_id = roomId
        }

        const { error: linkError } = await supabase
          .from('tenancy_tenants')
          .insert(linkPayload)

        if (linkError) {
          console.error('Warning: tenancy created but tenant link failed:', linkError)
        }
      }

      navigate('/tenancies')
    } catch (err) {
      console.error('Error creating tenancy:', err)
      setError(err instanceof Error ? err.message : 'Failed to create tenancy')
    } finally {
      setLoading(false)
    }
  }

  const tenancyTypes = [
    { value: 'periodic', label: 'Periodic' },
    { value: 'fixed_term', label: 'Fixed Term' },
  ]

  const depositSchemes = [
    { value: 'dps', label: 'DPS' },
    { value: 'tds', label: 'TDS' },
    { value: 'mydeposits', label: 'MyDeposits' },
  ]

  if (propertiesLoading || loadingTenants) {
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
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
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

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-600 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Property</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {properties.length > 0 ? (
              <>
                <Select
                  label="Select Property"
                  name="property_id"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  options={[
                    { value: '', label: 'Choose a property...' },
                    ...properties.map((p) => ({
                      value: p.id,
                      label: `${p.address_line1}, ${p.town} (${p.postcode})`,
                    })),
                  ]}
                  required
                />

                {selectedProperty && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-1">
                    <p>
                      <span className="font-medium text-slate-700">Type:</span>{' '}
                      {selectedProperty.property_type === 'btl' ? 'Buy to Let' :
                       selectedProperty.property_type === 'hmo' ? 'HMO' :
                       selectedProperty.property_type === 'commercial' ? 'Commercial' :
                       selectedProperty.property_type === 'holiday_let' ? 'Holiday Let' :
                       selectedProperty.property_type || '—'}
                    </p>
                    {selectedProperty.epc_rating && (
                      <p>
                        <span className="font-medium text-slate-700">EPC:</span>{' '}
                        {selectedProperty.epc_rating}
                        {selectedProperty.epc_expiry && ` (expires ${new Date(selectedProperty.epc_expiry).toLocaleDateString('en-GB')})`}
                      </p>
                    )}
                    {selectedProperty.legal_entities && (
                      <p>
                        <span className="font-medium text-slate-700">Owned by:</span>{' '}
                        {selectedProperty.legal_entities.name} ({selectedProperty.legal_entities.company_number})
                      </p>
                    )}
                  </div>
                )}

                {/* HMO Room Selection */}
                {isHmo && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-amber-800">
                      This is an HMO property — select which room the tenant will occupy.
                    </p>
                    {roomsLoading ? (
                      <p className="text-sm text-amber-600">Loading rooms...</p>
                    ) : rooms.length > 0 ? (
                      <Select
                        label="Room"
                        name="room_id"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        options={rooms.map((r) => ({
                          value: r.id,
                          label: r.floor != null ? `${r.room_label} (Floor ${r.floor})` : r.room_label,
                        }))}
                      />
                    ) : (
                      <p className="text-sm text-amber-600">
                        No rooms set up for this property yet.{' '}
                        <a
                          href={`/properties/${propertyId}`}
                          className="text-teal-700 hover:underline font-medium"
                        >
                          Add rooms on the property page
                        </a>{' '}
                        first, or continue without a room assignment.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-600 mb-3">
                  You haven't added any properties yet.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/properties/add')}
                >
                  Add Your First Property
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Tenant Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Tenant</h2>
          </CardHeader>
          <CardBody>
            {tenants.length > 0 ? (
              <Select
                label="Select Tenant (optional)"
                name="tenant_id"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                options={[
                  { value: '', label: 'No tenant yet — assign later' },
                  ...tenants.map((t) => ({
                    value: t.id,
                    label: `${t.full_name} (${t.email})`,
                  })),
                ]}
              />
            ) : (
              <p className="text-sm text-slate-600">
                No tenants yet.{' '}
                <a href="/tenants/invite" className="text-teal-700 hover:underline font-medium">
                  Invite a tenant
                </a>{' '}
                first, or you can add a tenant after creating this tenancy.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Tenancy Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Tenancy Details</h2>
          </CardHeader>
          <CardBody className="space-y-6">
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

            {formData.tenancy_type === 'fixed_term' && (
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
              label="Monthly Rent (&pound;)"
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
              label="Deposit Amount (&pound;)"
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
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" loading={loading} disabled={!propertyId}>
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
    </div>
  )
}
