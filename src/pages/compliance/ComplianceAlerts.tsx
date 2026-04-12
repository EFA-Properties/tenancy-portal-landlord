import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useComplianceAlerts } from '../../hooks/useComplianceAlerts'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function ComplianceAlerts() {
  const [searchParams] = useSearchParams()
  const propertyId = searchParams.get('property_id')
  const { data: alerts = [], isLoading } = useComplianceAlerts(propertyId || undefined)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-abode-teal" />
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'completed': return 'default'
      case 'overdue': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-instrument font-bold text-abode-text mb-8">
        Compliance Alerts
      </h1>

      {alerts.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No compliance alerts"
              description="All your compliance requirements are up to date."
              icon={<AlertTriangle size={32} />}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.title}</TableCell>
                  <TableCell>{alert.alert_type}</TableCell>
                  <TableCell>{format(new Date(alert.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(alert.status)}>
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </Badge>
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
