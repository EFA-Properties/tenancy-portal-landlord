import React from 'react'
import { Link } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'

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

function CompanyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="14" height="14" rx="1.5" />
      <path d="M7 5V3a1 1 0 011-1h4a1 1 0 011 1v2M7 10h6M7 14h4" />
    </svg>
  )
}

function PropertyRow({ property }: { property: any }) {
  return (
    <Link to={`/properties/${property.id}`}>
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

  // Group properties by legal entity
  const individualProperties = properties.filter((p: any) => !p.legal_entity_id)
  const companyGroups: Record<string, { name: string; company_number: string; properties: any[] }> = {}

  properties.forEach((p: any) => {
    if (p.legal_entity_id && p.legal_entities) {
      const key = p.legal_entity_id
      if (!companyGroups[key]) {
        companyGroups[key] = {
          name: p.legal_entities.name,
          company_number: p.legal_entities.company_number,
          properties: [],
        }
      }
      companyGroups[key].properties.push(p)
    }
  })

  const hasCompanyProperties = Object.keys(companyGroups).length > 0

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
        <div className="space-y-8">
          {/* Company-owned properties grouped by entity */}
          {Object.entries(companyGroups).map(([entityId, group]) => (
            <div key={entityId}>
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div className="text-teal-700">
                  <CompanyIcon />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {group.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Company No. {group.company_number} · {group.properties.length} {group.properties.length === 1 ? 'property' : 'properties'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {group.properties.map((property: any) => (
                  <PropertyRow key={property.id} property={property} />
                ))}
              </div>
            </div>
          ))}

          {/* Individual properties */}
          {individualProperties.length > 0 && (
            <div>
              {hasCompanyProperties && (
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <div className="text-slate-400">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="6" r="3" />
                      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Individual
                    </h2>
                    <p className="text-xs text-slate-400">
                      {individualProperties.length} {individualProperties.length === 1 ? 'property' : 'properties'}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {individualProperties.map((property: any) => (
                  <PropertyRow key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
