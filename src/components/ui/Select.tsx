import React from 'react'
import clsx from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string }>
}

export function Select({
  label,
  error,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-abode-text mb-2">
          {label}
          {props.required && <span className="text-abode-red ml-1">*</span>}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-2 rounded-[8px] border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-abode-teal focus:border-transparent',
          'bg-abode-bg2 cursor-pointer',
          error ? 'border-abode-red bg-abode-red-light' : 'border-abode-border',
          className,
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
      {error && <p className="mt-1 text-sm text-abode-red">{error}</p>}
    </div>
  )
}
