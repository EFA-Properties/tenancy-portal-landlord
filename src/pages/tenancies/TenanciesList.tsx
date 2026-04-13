import React from 'react'
import { Link } from 'react-router-dom'
import { useTenancies } from '../../hooks/useTenancies'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { formatDate } from '../../lib/utils'

export default function TenanciesList() {
  const { data: tenancies = [], isLoading } = useTenancies()

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
          Tenancies
        </h1>
        <Link to="/tenancies/new">
          <Button>Add Tenancy</Button>
        </Link>
      </div>

      {tenancies.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No tenancies yet"
              description="Create your first tenancy to get started."
              action={{ label: 'Add Tenancy', onClick: () => window.location.href = '/tenancies/new' }}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Property</TableHeader>
                <TableHeader>Tenant</TableHeader>
                <TableHeader>Start Date</TableHeader>
                <TableHeader>Monthly Rent</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenancies.map((tenancy) => {
                const property = (tenancy as any).properties
                const propertyAddress = property
                  ? `${property.address_line1}${property.town ? `, ${property.town}` : ''}`
                  : 'Unknown Property'

                return (
                  <TableRow key={tenancy.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <Link to={`/tenancies/${tenancy.id}`} className="hover:underline">
                        {propertyAddress}
                      </Link>
                    </TableCell>
                    <TableCell>{(tenancy as any).tenant_id ? 'Linked' : '—'}</TableCell>
                    <TableCell>{formatDate(tenancy.start_date)}</TableCell>
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
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
