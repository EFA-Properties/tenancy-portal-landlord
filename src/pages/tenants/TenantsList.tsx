import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useTenants, useSearchTenants } from '../../hooks/useTenants'
import { Users } from 'lucide-react'

export function TenantsList() {
  const [search, setSearch] = useState('')
  const { data: tenants, isLoading } = useTenants()
  const { data: searchResults } = useSearchTenants(search)
  const navigate = useNavigate()

  const displayTenants = search ? searchResults : tenants

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tenants' }
      ]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Tenants
        </h1>
        <Button onClick={() => navigate('/tenants/invite')}>
          <Plus size={20} className="mr-2" />
          Invite Tenant
        </Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-slate-500">Loading tenants...</div>
        </div>
      ) : !displayTenants || displayTenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Tenants"
          description="Invite your first tenant to get started."
          action={{ label: 'Invite Tenant', onClick: () => navigate('/tenants/invite') }}
        />
      ) : (
        <div className="space-y-3">
          {displayTenants.map((tenant) => (
            <Card
              key={tenant.id}
              onClick={() => navigate(`/tenants/${tenant.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {tenant.full_name}
                  </p>
                  <p className="text-sm text-slate-500">{tenant.email}</p>
                </div>
                {tenant.phone && (
                  <p className="text-sm text-slate-500">{tenant.phone}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
