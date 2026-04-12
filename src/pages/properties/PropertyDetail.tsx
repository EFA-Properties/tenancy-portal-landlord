import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProperty } from '../../hooks/useProperties'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!property) {
    return <div className="text-center py-12">Property not found</div>
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Properties', href: '/properties' },
          { label: property.name },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {property.name}
        </h1>
        <Button variant="outline" onClick={() => navigate('/properties')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Property Details
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Address</p>
              <p className="font-medium text-slate-900">{property.address}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">City</p>
              <p className="font-medium text-slate-900">{property.city}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Postcode</p>
              <p className="font-medium text-slate-900">{property.postcode}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Type</p>
              <p className="font-medium text-slate-900">{property.property_type}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Specifications
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Bedrooms</p>
              <p className="font-medium text-slate-900">{property.bedrooms}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Bathrooms</p>
              <p className="font-medium text-slate-900">{property.bathrooms}</p>
            </div>
            {property.description && (
              <div>
                <p className="text-sm text-slate-600">Description</p>
                <p className="font-medium text-slate-900">{property.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
