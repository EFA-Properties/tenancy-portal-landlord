import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMaintenanceRequests } from '../../hooks/useMaintenanceRequests'
import { Wrench } from 'lucide-react'
import { formatDate } from 'date-fns'

export function MaintenanceList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data: maintenance, isLoading } = useMaintenanceRequests()
  const navigate = useNavigate()

  const filtered = maintenance?.filter(m =>
    !statusFilter || m.status === statusFilter
  ) || []

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Maintenance' }
      ]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Maintenance Requests
        </h1>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'reported', 'acknowledged', 'in_progress', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status ? status.replace(/_/g, ' ').toUpperCase() : 'All'}
          </button>
        ))}
      </div>

      {/* Maintenance List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-slate-500">Loading maintenance requests...</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Maintenance Requests"
          description="All properties are in good condition."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Card
              key={req.id}
              onClick={() => navigate(`/maintenance/${req.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {(req.category || 'uncategorised').replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-1">
                      {req.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={req.status} />
                    <StatusBadge status={req.priority} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
                  <span>Reported {formatDate(new Date(req.reported_at), 'MMM d, yyyy')}</span>
                  {req.is_awaab_applicable && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                      Awaab Applicable
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
