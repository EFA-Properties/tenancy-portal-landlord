import React from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
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
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variant === 'default' && 'bg-blue-100 text-blue-800',
        variant === 'secondary' && 'bg-slate-100 text-slate-800',
        variant === 'destructive' && 'bg-red-100 text-red-800',
        variant === 'outline' && 'border border-slate-300 text-slate-800 bg-white',
        className,
      )}
    >
      {children}
    </span>
  )
}
