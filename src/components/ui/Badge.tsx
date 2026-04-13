import React from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'rounded-full font-medium inline-flex items-center justify-center',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        variant === 'default' && 'bg-teal-50 text-teal-700',
        variant === 'secondary' && 'bg-slate-100 text-slate-600',
        variant === 'destructive' && 'bg-red-50 text-red-600',
        variant === 'success' && 'bg-emerald-50 text-emerald-700',
        variant === 'warning' && 'bg-amber-50 text-amber-700',
        variant === 'outline' && 'border border-slate-200 text-slate-600 bg-white',
        className,
      )}
    >
      {children}
    </span>
  )
}
