import React from 'react'
import { Badge } from './Badge'

interface StatusBadgeProps {
  status: string
}

function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'active':
    case 'resolved':
    case 'completed':
      return 'default'
    case 'pending':
    case 'in_progress':
      return 'secondary'
    case 'closed':
    case 'ended':
      return 'outline'
    case 'overdue':
    case 'urgent':
    case 'high':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  )
}
