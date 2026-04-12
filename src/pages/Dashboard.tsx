import React from 'react'
import { AlertCircle, Building2, CheckCircle2, Wrench } from 'lucide-react'
import { Breadcrumb } from '../components/Breadcrumb'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import {
  useDashboardStats,
  useUpcomingDocumentExpiries,
  useRecentMaintenanceRequests,
} from '../hooks/useDashboardStats'
import { formatDate } from 'date-fns'

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: expiries, isLoading: expiriesLoading } = useUpcomingDocumentExpiries()
  const { data: maintenance, isLoading: maintenanceLoading } = useRecentMaintenanceRequests()

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mb-1">Total Properties</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.totalProperties || 0}
              </p>
            </div>
            <Building2 size={32} className="text-teal-200" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mb-1">Active Tenancies</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.activeTenancies || 0}
              </p>
            </div>
            <CheckCircle2 size={32} className="text-green-200" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mb-1">Compliance Alerts</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.complianceAlerts || 0}
              </p>
            </div>
            <AlertCircle size={32} className="text-amber-200" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mb-1">Pending Maintenance</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.pendingMaintenance || 0}
              </p>
            </div>
            <Wrench size={32} className="text-blue-200" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Document Expiries */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Document Expiries</CardTitle>
          </CardHeader>
          <CardContent>
            {expiriesLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-slate-500">Loading...</div>
              </div>
            ) : !expiries || expiries.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No Upcoming Expiries"
                description="All your documents are up to date."
              />
            ) : (
              <div className="space-y-3">
                {expiries.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {doc.document_type.toUpperCase()}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {doc.valid_to && formatDate(new Date(doc.valid_to), 'MMM d')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-slate-500">Loading...</div>
              </div>
            ) : !maintenance || maintenance.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No Maintenance Requests"
                description="All properties are in good order."
              />
            ) : (
              <div className="space-y-3">
                {maintenance.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {req.category.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {req.description}
                      </p>
                    </div>
                    <StatusBadge status={req.status as any} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
