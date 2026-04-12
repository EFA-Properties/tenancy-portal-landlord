import React from 'react'
import clsx from 'clsx'

export function Table({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <thead
      className={clsx(
        'bg-slate-50 border-b border-slate-200',
        className,
      )}
    >
      {children}
    </thead>
  )
}

export function TableBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <tbody className={clsx('divide-y divide-slate-200', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <tr
      className={clsx(
        'hover:bg-slate-50 transition-colors',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function TableHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={clsx(
        'px-6 py-3 text-left text-sm font-semibold text-slate-700',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={clsx('px-6 py-4 text-sm text-slate-600', className)}>
      {children}
    </td>
  )
}
