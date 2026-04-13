import React from 'react'
import { Link } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { epcRatingColor } from '../../lib/utils'

function PropertyIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l7-7 7 7M5 8v8a1 1 0 001 1h8a1 1 0 001-1V8" />
        <path d="M8 17v-5h4v5" />
      </svg>
    </div>
  )
}

export default function PropertiesList() {
  const { data: properties = [], isLoading } = useProperties()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
            Properties
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} in your portfolio
          </p>
        </div>
        <Link to="/properties/new">
          <Button>Add Property</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No properties yet"
              description="Add your first property to get started."
              action={{ label: 'Add Property', onClick: () => window.location.href = '/properties/new' }}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <Link key={property.id} to={`/properties/${property.id}`}>
              <Card className="hover:shadow-card-hover hover:border-slate-200 transition-all cursor-pointer">
                <div className="flex items-center gap-5 px-6 py-5">
                  <PropertyIcon />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-slate-900">
                      {property.address_line1}
                      {property.address_line2 ? `, ${property.address_line2}` : ''}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {property.town}
                      {property.county ? `, ${property.county}` : ''}
                      {property.postcode ? ` · ${property.postcode}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {property.is_hmo && (
                      <Badge variant="secondary" size="sm">HMO</Badge>
                    )}
                    {property.property_type && (
                      <Badge variant="outline" size="sm">
                        {property.property_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    )}
                    {property.epc_rating && (
                      <Badge
                        size="sm"
                        variant={
                          ['A', 'B', 'C'].includes(property.epc_rating.toUpperCase())
                            ? 'success'
                            : ['D'].includes(property.epc_rating.toUpperCase())
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        EPC {property.epc_rating}
                      </Badge>
                    )}
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 20 20">
                      <path d="M8 4l6 6-6 6" />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
