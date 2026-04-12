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
  const [formData, setFormData] = useState({
    property_id: '',
    tenant_id: '',
    tenancy_type: 'periodic',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    rent_due_day: '1',
    deposit_amount: '',
    deposit_scheme: '',
    deposit_scheme_ref: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Array<{ id: string; address_line1: string }>>([])
  const [tenants, setTenants] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const { data: landlord } = await supabase
          .from('landlords')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!landlord) {
          setError('Landlord record not found')
          setLoadingData(false)
          return
        }

        const [{ data: propsData }, { data: tenantsData }] = await Promise.all([
          supabase
            .from('properties')
            .select('id, address_line1')
            .eq('landlord_id', landlord.id),
          supabase.from('tenants').select('id, full_name, email'),
        ])

        setProperties(propsData || [])
        setTenants(tenantsData || [])
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load properties and tenants')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: landlord } = await supabase
        .from('landlords')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!landlord) throw new Error('Landlord not found')

      const { error: tenancyError } = await supabase
        .from('tenancies')
        .insert({
          landlord_id: landlord.id,
          property_id: formData.property_id,
          unit_id: null,
          legal_entity_id: null,
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
        <h1 className="text-3xl font-instrument font-bold text-abode-text mb-8">
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

      <h1 className="text-3xl font-instrument font-bold text-abode-text mb-8">
        Add New Tenancy
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-abode-text">
            Tenancy Details
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-abode-red-light border border-abode-red rounded-lg text-abode-red">
                {error}
              </div>
            )}

            <Select
              label="Property"
              name="property_id"
              value={formData.property_id}
              onChange={handleChange}
              options={properties.map((p) => ({
                value: p.id,
                label: p.address_line1,
              }))}
              required
            />

            <Select
              label="Tenant"
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              options={tenants.map((t) => ({
                value: t.id,
                label: `${t.full_name} (${t.email})`,
              }))}
              required
            />

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
