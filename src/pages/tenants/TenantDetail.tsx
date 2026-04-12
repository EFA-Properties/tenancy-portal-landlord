import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenant } from '../../hooks/useTenants'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Mail, Phone } from 'lucide-react'

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenant, isLoading } = useTenant(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!tenant) {
    return <div className="text-center py-12">Tenant not found</div>
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenants', href: '/tenants' },
          { label: `${tenant.first_name} ${tenant.last_name}` },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {tenant.first_name} {tenant.last_name}
        </h1>
        <Button variant="outline" onClick={() => navigate('/tenants')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Personal Information
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-900">
                {tenant.first_name} {tenant.last_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              <a href={`mailto:${tenant.email}`} className="text-blue-600 hover:text-blue-600">
                {tenant.email}
              </a>
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${tenant.phone}`} className="text-blue-600 hover:text-blue-600">
                  {tenant.phone}
                </a>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Emergency Contact
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {tenant.emergency_contact ? (
              <>
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">
                    {tenant.emergency_contact}
                  </p>
                </div>
                {tenant.emergency_phone && (
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <a href={`tel:${tenant.emergency_phone}`} className="text-blue-600 hover:text-blue-600">
                      {tenant.emergency_phone}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-600">No emergency contact provided</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
