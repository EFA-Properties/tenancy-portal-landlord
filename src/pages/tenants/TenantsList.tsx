import React from 'react'
import { Link } from 'react-router-dom'
import { useTenants } from '../../hooks/useTenants'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

export default function TenantsList() {
  const { data: tenants = [], isLoading } = useTenants()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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

      {tenants.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No tenants yet"
              description="Invite your first tenant to get started."
              action={{ label: 'Invite Tenant', onClick: () => window.location.href = '/tenants/invite' }}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    {tenant.first_name} {tenant.last_name}
                  </TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone || '-'}</TableCell>
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
