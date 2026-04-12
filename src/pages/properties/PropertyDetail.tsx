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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abode-teal" />
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
        <h1 className="text-3xl font-instrument font-bold text-abode-text">
          {property.name}
        </h1>
        <Button variant="outline" onClick={() => navigate('/properties')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-abode-text">
              Property Details
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-abode-text2">Address</p>
              <p className="font-medium text-abode-text">{property.address}</p>
            </div>
            <div>
              <p className="text-sm text-abode-text2">City</p>
              <p className="font-medium text-abode-text">{property.city}</p>
            </div>
            <div>
              <p className="text-sm text-abode-text2">Postcode</p>
              <p className="font-medium text-abode-text">{property.postcode}</p>
            </div>
            <div>
              <p className="text-sm text-abode-text2">Type</p>
              <p className="font-medium text-abode-text">{property.property_type}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-abode-text">
              Specifications
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-abode-text2">Bedrooms</p>
              <p className="font-medium text-abode-text">{property.bedrooms}</p>
            </div>
            <div>
              <p className="text-sm text-abode-text2">Bathrooms</p>
              <p className="font-medium text-abode-text">{property.bathrooms}</p>
            </div>
            {property.description && (
              <div>
                <p className="text-sm text-abode-text2">Description</p>
                <p className="font-medium text-abode-text">{property.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
