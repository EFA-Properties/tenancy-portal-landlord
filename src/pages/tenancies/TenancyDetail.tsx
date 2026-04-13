import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTenancy } from '../../hooks/useTenancies'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'

export default function TenancyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenancy, isLoading } = useTenancy(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!tenancy) {
    return <div className="text-center py-12">Tenancy not found</div>
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          { label: `Tenancy ${tenancy.id.slice(0, 8)}` },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Tenancy Details
        </h1>
        <Button variant="outline" onClick={() => navigate('/tenancies')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Property Information
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Address</p>
              <p className="font-medium text-slate-900">
                {(tenancy as any).properties
                  ? `${(tenancy as any).properties.address_line1}, ${(tenancy as any).properties.town}, ${(tenancy as any).properties.postcode}`
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Property Type</p>
              <p className="font-medium text-slate-900">
                {(tenancy as any).properties?.property_type || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
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
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Financial Information
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Monthly Rent</p>
              <p className="text-2xl font-bold text-slate-900">
                £{tenancy.monthly_rent.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Start Date</p>
              <p className="font-medium text-slate-900">
                {formatDate(tenancy.start_date)}
              </p>
            </div>
            {tenancy.end_date && (
              <div>
                <p className="text-sm text-slate-600">End Date</p>
                <p className="font-medium text-slate-900">
                  {formatDate(tenancy.end_date)}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Tenant Information
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Tenant</p>
              <p className="font-medium text-slate-900">
                {tenancy.tenant_id ? `Tenant ${tenancy.tenant_id}` : 'No tenant linked'}
              </p>
            </div>
            {/* TODO: Add tenant linking functionality once tenant_id column is added to tenancies table */}
            <Button variant="outline" size="sm">
              Link Tenant
            </Button>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Related Items
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to={`/documents?tenancy_id=${tenancy.id}`}>
                <Button variant="outline" className="w-full">
                  View Documents
                </Button>
              </Link>
              <Link to={`/maintenance?property_id=${tenancy.property_id}`}>
                <Button variant="outline" className="w-full">
                  Maintenance Requests
                </Button>
              </Link>
              <Link to={`/tenancies/${tenancy.id}/edit`}>
                <Button variant="outline" className="w-full">
                  Edit Tenancy
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
