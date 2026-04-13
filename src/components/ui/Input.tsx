import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({
  label,
  error,
  helperText,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-2.5 rounded-lg border text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600',
          'placeholder:text-slate-300',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-slate-200 bg-white hover:border-slate-300',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  )
}
