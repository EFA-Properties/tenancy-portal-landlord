import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon ? (
        <div className="mb-5 text-slate-300">{icon}</div>
      ) : (
        <div className="mb-5 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-fraunces font-semibold text-slate-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm mb-7 max-w-sm text-center">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
