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
        'rounded-pill font-mono font-medium uppercase tracking-wider inline-flex items-center justify-center',
        size === 'sm' ? 'px-2.5 py-0.5 text-[9px] tracking-[0.1em]' : 'px-3.5 py-1 text-[11px] tracking-[0.08em]',
        variant === 'default' && 'bg-teal-50 text-teal-700',
        variant === 'secondary' && 'bg-surface text-textSecondary',
        variant === 'destructive' && 'bg-errorLight text-error',
        variant === 'success' && 'bg-successLight text-success',
        variant === 'warning' && 'bg-warningLight text-warning',
        variant === 'outline' && 'border border-border2 text-textSecondary bg-white',
        className,
      )}
    >
      {children}
    </span>
  )
}
