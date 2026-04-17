import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTenantsWithStatus, TenantWithStatus } from '../../hooks/useTenants'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { formatDate } from '../../lib/utils'

type Tab = 'active' | 'archived'

export default function TenantsList() {
  const { data: tenants = [], isLoading } = useTenantsWithStatus()
  const [tab, setTab] = useState<Tab>('active')

  const activeTenants = tenants.filter((t) => t.tenancy_status !== 'moved_out')
  const archivedTenants = tenants.filter((t) => t.tenancy_status === 'moved_out')
  const filtered = tab === 'active' ? activeTenants : archivedTenants

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
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Tenants
        </h1>
        <Link to="/tenants/invite">
          <Button>Invite Tenant</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'active'
              ? 'border-teal-700 text-teal-700'
              : 'border-transparent text-textMuted hover:text-textSecondary'
          }`}
        >
          Active
          {activeTenants.length > 0 && (
            <span className="ml-2 text-xs bg-surface text-textMuted px-1.5 py-0.5 rounded-full">
              {activeTenants.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('archived')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'archived'
              ? 'border-teal-700 text-teal-700'
              : 'border-transparent text-textMuted hover:text-textSecondary'
          }`}
        >
          Moved Out
          {archivedTenants.length > 0 && (
            <span className="ml-2 text-xs bg-surface text-textMuted px-1.5 py-0.5 rounded-full">
              {archivedTenants.length}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title={tab === 'active' ? 'No active tenants' : 'No moved-out tenants'}
              description={
                tab === 'active'
                  ? 'Invite your first tenant to get started.'
                  : 'Tenants you move out will appear here for your records.'
              }
              action={
                tab === 'active'
                  ? { label: 'Invite Tenant', onClick: () => window.location.href = '/tenants/invite' }
                  : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Property</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Phone</TableHeader>
                {tab === 'archived' && <TableHeader>Moved Out</TableHeader>}
                <TableHeader>Status</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((tenant: TenantWithStatus) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    {tenant.first_name} {tenant.last_name}
                  </TableCell>
                  <TableCell className="text-textSecondary text-sm">
                    {tenant.property_address || '—'}
                  </TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone || '—'}</TableCell>
                  {tab === 'archived' && (
                    <TableCell className="text-sm text-textMuted">
                      {tenant.moved_out_at ? formatDate(tenant.moved_out_at) : '—'}
                    </TableCell>
                  )}
                  <TableCell>
                    {tenant.access_revoked_at ? (
                      <Badge variant="destructive" size="sm">Access Revoked</Badge>
                    ) : tenant.tenancy_status === 'moved_out' ? (
                      <Badge variant="secondary" size="sm">Moved Out</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to={`/tenants/${tenant.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
