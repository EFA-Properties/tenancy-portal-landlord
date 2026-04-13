import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProperty, usePropertyTenancies } from '../../hooks/useProperties'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { formatDate, epcRatingColor } from '../../lib/utils'

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
    return <div className="text-center py-12">Property not found</div>
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
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {property.address_line1}, {property.town}
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
              <p className="font-medium text-slate-900">
                {property.address_line1}{property.address_line2 ? `, ${property.address_line2}` : ''}, {property.town}{property.county ? `, ${property.county}` : ''}, {property.postcode}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Type</p>
              <p className="font-medium text-slate-900">
                {property.property_type
                  ? property.property_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                  : '—'}
              </p>
            </div>
            {property.is_hmo && (
              <div>
                <Badge variant="secondary">HMO</Badge>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              EPC & Compliance
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {property.epc_rating ? (
              <>
                <div>
                  <p className="text-sm text-slate-600">EPC Rating</p>
                  <Badge className={epcRatingColor(property.epc_rating)}>
                    {property.epc_rating}
                  </Badge>
                </div>
                {property.epc_score && (
                  <div>
                    <p className="text-sm text-slate-600">EPC Score</p>
                    <p className="font-medium text-slate-900">{property.epc_score}</p>
                  </div>
                )}
                {property.epc_expiry && (
                  <div>
                    <p className="text-sm text-slate-600">EPC Expiry</p>
                    <p className="font-medium text-slate-900">{formatDate(property.epc_expiry)}</p>
                  </div>
                )}
                {property.uprn && (
                  <div>
                    <a
                      href={`https://find-energy-certificate.service.gov.uk/energy-certificate/${property.uprn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Full EPC Certificate
                    </a>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-600">No EPC data available.</p>
            )}
            {property.gas_safety_expiry && (
              <div>
                <p className="text-sm text-slate-600">Gas Safety (CP12) Expiry</p>
                <p className="font-medium text-slate-900">{formatDate(property.gas_safety_expiry)}</p>
              </div>
            )}
            {property.eicr_expiry && (
              <div>
                <p className="text-sm text-slate-600">EICR Expiry</p>
                <p className="font-medium text-slate-900">{formatDate(property.eicr_expiry)}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Tenancies
              </h2>
              <Link to="/tenancies/new">
                <Button size="sm">Add Tenancy</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {tenanciesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : tenancies.length === 0 ? (
              <p className="text-slate-600">No tenancies for this property yet.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Tenant</TableHeader>
                    <TableHeader>Start Date</TableHeader>
                    <TableHeader>End Date</TableHeader>
                    <TableHeader>Monthly Rent</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenancies.map((tenancy: any) => (
                    <TableRow key={tenancy.id}>
                      <TableCell className="font-medium">
                        {tenancy.tenants ? tenancy.tenants.full_name : '—'}
                      </TableCell>
                      <TableCell>{formatDate(tenancy.start_date)}</TableCell>
                      <TableCell>{formatDate(tenancy.end_date)}</TableCell>
                      <TableCell>£{tenancy.monthly_rent.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tenancy.status === 'active'
                              ? 'default'
                              : tenancy.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/tenancies/${tenancy.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Documents & Compliance
            </h2>
          </CardHeader>
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
