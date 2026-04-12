import React from 'react'
import clsx from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'w-full px-4 py-2 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2',
            'transition-colors',
            icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-600',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
