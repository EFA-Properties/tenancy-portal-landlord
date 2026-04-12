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
        <label className="block text-sm font-medium text-abode-text mb-2">
          {label}
          {props.required && <span className="text-abode-red ml-1">*</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-2 rounded-[8px] border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-abode-teal focus:border-transparent',
          error
            ? 'border-abode-red bg-abode-red-light'
            : 'border-abode-border bg-abode-bg2',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-abode-red">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-abode-text3">{helperText}</p>
      )}
    </div>
  )
}
