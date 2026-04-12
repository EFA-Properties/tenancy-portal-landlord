import { Badge } from './Badge'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
    // Tenancy statuses
    active: { variant: 'success', label: 'Active' },
    ended: { variant: 'danger', label: 'Ended' },
    pending: { variant: 'warning', label: 'Pending' },
    // Tenancy types
    periodic: { variant: 'info', label: 'Periodic' },
    fixed_term: { variant: 'info', label: 'Fixed Term' },
    // Maintenance statuses
    reported: { variant: 'info', label: 'Reported' },
    acknowledged: { variant: 'info', label: 'Acknowledged' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    closed: { variant: 'default', label: 'Closed' },
    // Priority levels
    emergency: { variant: 'danger', label: 'Emergency' },
    urgent: { variant: 'warning', label: 'Urgent' },
    routine: { variant: 'info', label: 'Routine' },
    // Alert levels
    info: { variant: 'info', label: 'Info' },
    warning: { variant: 'warning', label: 'Warning' },
    critical: { variant: 'danger', label: 'Critical' },
    overdue: { variant: 'danger', label: 'Overdue' },
    // Boolean-style
    unresolved: { variant: 'warning', label: 'Unresolved' },
    // Property types
    btl: { variant: 'info', label: 'Buy to Let' },
    hmo: { variant: 'warning', label: 'HMO' },
    commercial: { variant: 'default', label: 'Commercial' },
    holiday_let: { variant: 'info', label: 'Holiday Let' },
  }

  const config = statusConfig[status] || { variant: 'default' as const, label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
