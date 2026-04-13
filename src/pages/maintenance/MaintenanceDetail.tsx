import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMaintenanceRequest } from '../../hooks/useMaintenanceRequests'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { format } from 'date-fns'

export default function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading } = useMaintenanceRequest(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!request) {
    return <div className="text-center py-12">Request not found</div>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'in_progress': return 'secondary'
      case 'resolved': return 'default'
      case 'closed': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Maintenance', href: '/maintenance' },
          { label: request.title },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {request.title}
        </h1>
        <Button variant="outline" onClick={() => navigate('/maintenance')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Request Details
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <Badge variant={getStatusColor(request.status)}>
                {request.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Priority</p>
              <Badge variant={getPriorityColor(request.priority)}>
                {request.priority.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Reported</p>
              <p className="font-medium text-slate-900">
                {format(new Date(request.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            {request.resolved_at && (
              <div>
                <p className="text-sm text-slate-600">Resolved</p>
                <p className="font-medium text-slate-900">
                  {format(new Date(request.resolved_at), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Description
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-slate-600">{request.description}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
