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
        'font-medium rounded-md transition-all inline-flex items-center justify-center gap-2',
        size === 'sm' && 'px-3.5 py-1.5 text-small',
        size === 'md' && 'px-5 py-2.5 text-[13.5px]',
        size === 'lg' && 'px-6 py-3 text-[15px]',
        variant === 'default' && 'bg-teal-700 text-white hover:bg-teal-600 shadow-sm disabled:opacity-50',
        variant === 'secondary' && 'bg-surface text-textSecondary hover:bg-slate-200 disabled:opacity-50',
        variant === 'destructive' && 'bg-error text-white hover:bg-red-700 disabled:opacity-50',
        variant === 'outline' && 'border border-border2 text-textSecondary hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50',
        variant === 'ghost' && 'text-teal-700 hover:bg-teal-50 disabled:opacity-50',
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
