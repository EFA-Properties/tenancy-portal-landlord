import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTenant } from '../../hooks/useTenants'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'

export function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenant, isLoading } = useTenant(id || '')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Tenant not found</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Tenants
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-2">
          {tenant.full_name}
        </h1>
        <p className="text-slate-500">{tenant.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Email</p>
              <p className="font-medium text-slate-900">{tenant.email}</p>
            </div>
            {tenant.phone && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Phone</p>
                <p className="font-medium text-slate-900">{tenant.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenancies</CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.tenancy_tenants && tenant.tenancy_tenants.length > 0 ? (
              <div className="space-y-2">
                {tenant.tenancy_tenants.map((tt: any) => (
                  <div key={tt.id} className="p-3 bg-slate-50 rounded-md">
                    <p className="text-sm font-medium text-slate-900">
                      {tt.tenancy?.unit?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tt.is_lead_tenant ? 'Lead tenant' : 'Co-tenant'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No active tenancies</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
