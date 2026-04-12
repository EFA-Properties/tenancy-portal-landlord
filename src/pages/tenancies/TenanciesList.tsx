import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useTenancies } from '../../hooks/useTenancies'
import { FileText } from 'lucide-react'
import { formatDate } from 'date-fns'

export function TenanciesList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data: tenancies, isLoading } = useTenancies()
  const navigate = useNavigate()

  const filtered = tenancies?.filter(t =>
    !statusFilter || t.status === statusFilter
  ) || []

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tenancies' }
      ]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Tenancies
        </h1>
        <Button onClick={() => navigate('/tenancies/add')}>
          <Plus size={20} className="mr-2" />
          Add Tenancy
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'active', 'pending', 'ended'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Tenancies Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-slate-500">Loading tenancies...</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Tenancies"
          description="Create your first tenancy to get started."
          action={{ label: 'Add Tenancy', onClick: () => navigate('/tenancies/add') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((tenancy) => (
            <Card
              key={tenancy.id}
              onClick={() => navigate(`/tenancies/${tenancy.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 mb-1">
                    Tenancy #{tenancy.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-slate-500">
                    From {formatDate(new Date(tenancy.start_date), 'MMM d, yyyy')}
                    {tenancy.end_date && ` to ${formatDate(new Date(tenancy.end_date), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      £{tenancy.monthly_rent}
                    </p>
                    <p className="text-xs text-slate-500">per month</p>
                  </div>
                  <StatusBadge status={tenancy.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
