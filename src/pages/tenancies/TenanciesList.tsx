import React from 'react'
import { Link } from 'react-router-dom'
import { useTenancies } from '../../hooks/useTenancies'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate } from '../../lib/utils'

function TenancyIcon({ status }: { status: string }) {
  const color = status === 'active' ? '#0f766e' : status === 'pending' ? '#d97706' : '#94a3b8'
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}10` }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="12" height="14" rx="1" />
        <path d="M8 7h4M8 10h4M8 13h2" />
      </svg>
    </div>
  )
}

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
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
            Tenancies
          </h1>
          <p className="text-textMuted text-small mt-1">
            {tenancies.length} {tenancies.length === 1 ? 'tenancy' : 'tenancies'} total
          </p>
        </div>
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
        <div className="space-y-3">
          {tenancies.map((tenancy) => {
            const property = (tenancy as any).properties
            const tenant = (tenancy as any).tenants
            const propertyAddress = property
              ? `${property.address_line1}${property.town ? `, ${property.town}` : ''}`
              : 'Unknown Property'

            return (
              <Link key={tenancy.id} to={`/tenancies/${tenancy.id}`}>
                <Card className="hover:shadow-card-hover hover:border-teal-700 transition-all cursor-pointer">
                  <div className="flex items-center gap-5 px-6 py-5">
                    <TenancyIcon status={tenancy.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-textPrimary">
                        {propertyAddress}
                      </p>
                      <p className="text-small text-textMuted mt-0.5">
                        {tenant ? tenant.full_name : 'No tenant linked'}
                        {' · '}
                        £{tenancy.monthly_rent.toFixed(2)}/month
                        {' · '}
                        Started {formatDate(tenancy.start_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
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
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 20 20">
                        <path d="M8 4l6 6-6 6" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
