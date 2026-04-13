import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProperty, usePropertyTenancies } from '../../hooks/useProperties'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatDate, epcRatingColor } from '../../lib/utils'

function CheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <circle cx="10" cy="10" r="10" fill="#0f766e" />
      <path d="M6.5 10l2 2L13.5 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="1.5" />
    </svg>
  )
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(id)
  const { data: tenancies = [], isLoading: tenanciesLoading } = usePropertyTenancies(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!property) {
    return <div className="text-center py-12 text-slate-500">Property not found</div>
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Properties', href: '/properties' },
          { label: `${property.address_line1}, ${property.town}` },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
            {property.address_line1}, {property.town}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {property.property_type && (
              <Badge variant="outline" size="sm">
                {property.property_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Badge>
            )}
            {property.is_hmo && (
              <Badge variant="secondary" size="sm">HMO</Badge>
            )}
            <span className="text-sm text-slate-400">{property.postcode}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/properties')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property details */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Address
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-[15px] text-slate-700 leading-relaxed">
              {property.address_line1}
              {property.address_line2 ? <><br />{property.address_line2}</> : null}
              <br />{property.town}
              {property.county ? <><br />{property.county}</> : null}
              <br />{property.postcode}
            </p>
          </CardBody>
        </Card>

        {/* EPC & Compliance */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              EPC & Compliance
            </h2>
          </CardHeader>
          <CardBody>
            {property.epc_rating ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                    style={{
                      backgroundColor: ['A', 'B'].includes(property.epc_rating.toUpperCase()) ? '#0f766e'
                        : property.epc_rating.toUpperCase() === 'C' ? '#0d9488'
                        : property.epc_rating.toUpperCase() === 'D' ? '#d97706'
                        : '#dc2626'
                    }}
                  >
                    {property.epc_rating}
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-slate-900">
                      EPC Rating {property.epc_rating}
                      {property.epc_score ? ` (${property.epc_score})` : ''}
                    </p>
                    {property.epc_expiry && (
                      <p className="text-sm text-slate-400 mt-0.5">
                        Valid to {formatDate(property.epc_expiry)}
                      </p>
                    )}
                  </div>
                </div>
                {property.uprn && (
                  <a
                    href={`https://find-energy-certificate.service.gov.uk/energy-certificate/${property.uprn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Full EPC Certificate
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No EPC data available.</p>
            )}
          </CardBody>
        </Card>

        {/* Compliance checklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">Compliance</p>
                <h2 className="text-lg font-fraunces font-semibold text-slate-900">
                  Document checklist
                </h2>
              </div>
              <Link to={`/documents?property_id=${property.id}`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {[
              { title: 'Gas Safety Certificate (CP12)', desc: 'Annual renewal required', hasExpiry: !!property.gas_safety_expiry, expiry: property.gas_safety_expiry },
              { title: 'EPC Certificate', desc: 'Minimum C rating from 2028', hasExpiry: !!property.epc_rating, expiry: property.epc_expiry },
              { title: 'EICR (Electrical Safety)', desc: 'Every 5 years', hasExpiry: !!property.eicr_expiry, expiry: property.eicr_expiry },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 px-8 py-5">
                {item.hasExpiry ? <CheckCircle /> : <EmptyCircle />}
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                {item.expiry && (
                  <Badge variant="success" size="sm">
                    Valid to {formatDate(item.expiry)}
                  </Badge>
                )}
                {!item.hasExpiry && (
                  <Badge variant="warning" size="sm">
                    Awaiting
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Tenancies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Tenancies
              </h2>
              <Link to="/tenancies/new">
                <Button size="sm">Add Tenancy</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {tenanciesLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
              </div>
            ) : tenancies.length === 0 ? (
              <p className="text-sm text-slate-400">No tenancies for this property yet.</p>
            ) : (
              <div className="space-y-3">
                {tenancies.map((tenancy: any) => (
                  <Link key={tenancy.id} to={`/tenancies/${tenancy.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {tenancy.tenants ? tenancy.tenants.full_name : 'No tenant linked'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          £{tenancy.monthly_rent.toFixed(2)}/month · Started {formatDate(tenancy.start_date)}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        variant={
                          tenancy.status === 'active'
                            ? 'success'
                            : tenancy.status === 'pending'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Actions */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to={`/documents?property_id=${property.id}`}>
                <Button variant="outline" className="w-full">
                  View Property Documents
                </Button>
              </Link>
              <Link to={`/maintenance?property_id=${property.id}`}>
                <Button variant="outline" className="w-full">
                  Maintenance Requests
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
