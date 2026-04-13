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
        'font-medium rounded-lg transition-all inline-flex items-center justify-center gap-2',
        size === 'sm' && 'px-3.5 py-1.5 text-sm',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'default' && 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm disabled:opacity-50',
        variant === 'secondary' && 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
        variant === 'outline' && 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50',
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
