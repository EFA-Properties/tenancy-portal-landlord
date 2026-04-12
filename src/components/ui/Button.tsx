import React from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'font-medium rounded-[8px] transition-colors inline-flex items-center justify-center gap-2',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        variant === 'default' && 'bg-abode-teal text-white hover:opacity-90 disabled:opacity-50',
        variant === 'secondary' && 'bg-abode-bg3 text-abode-text hover:bg-abode-border disabled:opacity-50',
        variant === 'destructive' && 'bg-abode-red text-white hover:opacity-90 disabled:opacity-50',
        variant === 'outline' && 'border border-abode-border text-abode-text hover:bg-abode-bg3 disabled:opacity-50',
        variant === 'ghost' && 'text-abode-text2 hover:text-abode-text disabled:opacity-50',
        disabled && 'cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
