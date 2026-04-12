import React from 'react'
import clsx from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-900 mb-2">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-2 border border-slate-200 rounded-md text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2',
          'transition-colors bg-white',
          error && 'border-red-500 focus:ring-red-600',
          className
        )}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
