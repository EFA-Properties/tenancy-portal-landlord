import React from 'react'
import clsx from 'clsx'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-900',
    info: 'bg-blue-100 text-blue-900',
  }

  return (
    <span
      className={clsx(
        'inline-block px-3 py-1 text-sm font-medium rounded-full',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
