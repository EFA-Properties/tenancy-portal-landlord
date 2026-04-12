import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function AddProperty() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postcode: '',
    property_type: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      navigate('/properties')
    }, 1000)
  }

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
            <Input
              label="Property Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Main Street Apartment"
              required
            />
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
              <Input
                label="Postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                placeholder="Postcode"
                required
              />
            </div>
            <Input
              label="Property Type"
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              placeholder="e.g., Flat, House, Bungalow"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bedrooms"
                name="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={handleChange}
                required
              />
              <Input
                label="Bathrooms"
                name="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add any additional details about the property..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
