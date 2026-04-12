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
        variant === 'default' && 'bg-abode-teal/10 text-abode-teal border border-abode-teal',
        variant === 'secondary' && 'bg-abode-bg3 text-abode-text2 border border-abode-border',
        variant === 'destructive' && 'bg-abode-red/10 text-abode-red border border-abode-red',
        variant === 'success' && 'bg-abode-green/10 text-abode-green border border-abode-green',
        variant === 'outline' && 'border border-abode-border text-abode-text bg-abode-bg2',
        className,
      )}
    >
      {children}
    </span>
  )
}
