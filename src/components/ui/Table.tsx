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
        'border-b border-slate-100',
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
    <tbody className={clsx('divide-y divide-slate-100', className)}>
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
        'hover:bg-slate-50/50 transition-colors',
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
        'px-6 py-4 text-left text-xs font-mono font-medium text-slate-400 uppercase tracking-wider',
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
    <td className={clsx('px-6 py-5 text-sm text-slate-600', className)}>
      {children}
    </td>
  )
}
