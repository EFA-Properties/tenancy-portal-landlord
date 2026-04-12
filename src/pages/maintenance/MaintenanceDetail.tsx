import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useMaintenanceRequest, useUpdateMaintenanceRequest } from '../../hooks/useMaintenanceRequests'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { formatDate } from 'date-fns'

export function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading } = useMaintenanceRequest(id || '')
  const { mutate: updateRequest, isPending } = useUpdateMaintenanceRequest()
  const [newStatus, setNewStatus] = useState<string>('')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Maintenance request not found</p>
      </div>
    )
  }

  const handleStatusChange = () => {
    if (newStatus) {
      updateRequest({
        ...request,
        status: newStatus as any,
      })
      setNewStatus('')
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/maintenance')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Maintenance
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-2">
          {request.title}
        </h1>
        <p className="text-slate-500">Reported {formatDate(new Date(request.reported_at), 'MMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Status</p>
              <StatusBadge status={request.status} />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Priority</p>
              <StatusBadge status={request.priority} />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Description</p>
              <p className="text-slate-900">{request.description}</p>
            </div>
            {request.is_awaab_applicable && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">
                  Awaab Applicable
                </p>
                {request.awaab_response_deadline && (
                  <p className="text-xs text-red-600 mt-1">
                    Deadline: {formatDate(new Date(request.awaab_response_deadline), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="New Status"
              options={[
                { value: 'reported', label: 'Reported' },
                { value: 'acknowledged', label: 'Acknowledged' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' }
              ]}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            />
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || newStatus === request.status}
              isLoading={isPending}
              className="w-full"
            >
              Update Status
            </Button>

            {request.tenant && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Reported By</p>
                <p className="font-medium text-slate-900">
                  {request.tenant.full_name}
                </p>
                <p className="text-sm text-slate-500">{request.tenant.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
