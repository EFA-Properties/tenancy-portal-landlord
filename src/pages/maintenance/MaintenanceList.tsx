import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMaintenanceRequests } from '../../hooks/useMaintenanceRequests'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

export default function MaintenanceList() {
  const [searchParams] = useSearchParams()
  const tenancyId = searchParams.get('tenancy_id')
  const { data: requests = [], isLoading } = useMaintenanceRequests(tenancyId || undefined)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abode-teal" />
      </div>
    )
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
      <h1 className="text-3xl font-instrument font-bold text-abode-text mb-8">
        Maintenance Requests
      </h1>

      {requests.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No maintenance requests"
              description="Your property is in good shape! Report an issue if you need maintenance."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Priority</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Reported</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link to={`/maintenance/${request.id}`}>
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
