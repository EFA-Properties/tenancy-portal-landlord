import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export default function AddTenancy() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    property_id: '',
    tenant_id: '',
    start_date: '',
    monthly_rent: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      navigate('/tenancies')
    }, 1000)
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
            Tenancy Details
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Property ID"
              name="property_id"
              value={formData.property_id}
              onChange={handleChange}
              placeholder="Enter property ID"
              required
            />
            <Input
              label="Tenant ID"
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              placeholder="Enter tenant ID"
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
