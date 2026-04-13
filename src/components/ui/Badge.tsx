import React from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
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
        'rounded-full font-mono font-medium inline-flex items-center justify-center uppercase tracking-[0.5px]',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variant === 'default' && 'bg-teal-50 text-teal-700 border border-teal-700',
        variant === 'secondary' && 'bg-slate-100 text-slate-600 border border-slate-200',
        variant === 'destructive' && 'bg-red-50 text-red-600 border border-red-600',
        variant === 'success' && 'bg-teal-50 text-teal-600 border border-teal-600',
        variant === 'outline' && 'border border-slate-200 text-slate-900 bg-white',
        className,
      )}
    >
      {children}
    </span>
  )
}
