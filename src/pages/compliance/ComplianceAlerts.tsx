import React, { useState } from 'react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useComplianceAlerts, useUpdateComplianceAlert } from '../../hooks/useComplianceAlerts'
import { AlertCircle } from 'lucide-react'
import { formatDate } from 'date-fns'

export function ComplianceAlerts() {
  const { data: alerts, isLoading } = useComplianceAlerts()
  const { mutate: updateAlert } = useUpdateComplianceAlert()
  const [statusFilter, setStatusFilter] = useState<string>('')

  const filtered = alerts?.filter(a => {
    if (!statusFilter) return true
    if (statusFilter === 'resolved') return a.is_resolved
    if (statusFilter === 'unresolved') return !a.is_resolved
    return false
  }) || []

  const handleResolve = (alertId: string) => {
    updateAlert({
      id: alertId,
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    } as any)
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Compliance' }
      ]} />

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Compliance Alerts
      </h1>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'unresolved', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status === '' ? 'All' : status === 'unresolved' ? 'Unresolved' : 'Resolved'}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-slate-500">Loading alerts...</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Compliance Alerts"
          description="Your properties are fully compliant."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {alert.alert_type}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {alert.message}
                    </p>
                  </div>
                  <Badge
                    variant={
                      alert.alert_level === 'critical' ? 'danger' :
                      alert.alert_level === 'overdue' ? 'danger' :
                      alert.alert_level === 'warning' ? 'warning' : 'info'
                    }
                  >
                    {alert.alert_level?.toUpperCase() || 'INFO'}
                  </Badge>
                </div>

                {alert.expiry_date && (
                  <p className="text-xs text-slate-500 mb-4">
                    Expires: {formatDate(new Date(alert.expiry_date), 'MMM d, yyyy')}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <StatusBadge status={alert.is_resolved ? 'resolved' : 'unresolved'} />
                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Mark Resolved
                    </button>
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
