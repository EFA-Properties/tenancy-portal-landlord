import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-slate-300 mb-4" />
      <h3 className="text-lg font-fraunces font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
