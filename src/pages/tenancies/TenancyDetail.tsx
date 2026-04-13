import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTenancy, useLinkTenant } from '../../hooks/useTenancies'
import { supabase } from '../../lib/supabase'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { formatDate } from '../../lib/utils'

export default function TenancyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenancy, isLoading } = useTenancy(id)
  const linkTenant = useLinkTenant()

  const [showLinkForm, setShowLinkForm] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [tenants, setTenants] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [loadingTenants, setLoadingTenants] = useState(false)

  const loadTenants = async () => {
    setLoadingTenants(true)
    const { data } = await supabase
      .from('tenants')
      .select('id, full_name, email')
    setTenants(data || [])
    setLoadingTenants(false)
  }

  const handleLinkTenant = async () => {
    if (!id || !selectedTenantId) return
    try {
      await linkTenant.mutateAsync({ tenancyId: id, tenantId: selectedTenantId })
      setShowLinkForm(false)
      setSelectedTenantId('')
    } catch (err) {
      console.error('Failed to link tenant:', err)
    }
  }

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

  const tenant = (tenancy as any).tenants
  const property = (tenancy as any).properties

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          { label: property
            ? `${property.address_line1}, ${property.town}`
            : `Tenancy ${tenancy.id.slice(0, 8)}`
          },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {property
            ? `${property.address_line1}, ${property.town}`
            : 'Tenancy Details'}
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
                {property
                  ? `${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ''}, ${property.town}${property.county ? `, ${property.county}` : ''}, ${property.postcode}`
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Property Type</p>
              <p className="font-medium text-slate-900">
                {property?.property_type
                  ? property.property_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                  : '—'}
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
            {property && (
              <Link to={`/properties/${property.id}`}>
                <Button variant="ghost" size="sm" className="mt-2">
                  View Full Property Details
                </Button>
              </Link>
            )}
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Tenant Information
              </h2>
              {!tenant && !showLinkForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLinkForm(true)
                    loadTenants()
                  }}
                >
                  Link Tenant
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {tenant ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">{tenant.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-medium text-slate-900">{tenant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="font-medium text-slate-900">{tenant.phone || '—'}</p>
                </div>
              </div>
            ) : showLinkForm ? (
              <div className="space-y-4">
                {loadingTenants ? (
                  <p className="text-sm text-slate-600">Loading tenants...</p>
                ) : tenants.length === 0 ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-3">
                      No tenants found. You need to invite a tenant first.
                    </p>
                    <Link to="/tenants/invite">
                      <Button size="sm">Invite Tenant</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Select
                        label="Select Tenant"
                        name="tenant_id"
                        value={selectedTenantId}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        options={tenants.map((t) => ({
                          value: t.id,
                          label: `${t.full_name} (${t.email})`,
                        }))}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLinkTenant}
                      loading={linkTenant.isPending}
                      disabled={!selectedTenantId}
                    >
                      Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No tenant linked to this tenancy.</p>
            )}
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
