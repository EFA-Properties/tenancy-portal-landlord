import React from 'react'
import clsx from 'clsx'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={clsx('w-full text-sm', className)}
      {...props}
    />
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={clsx('border-b border-slate-200 bg-slate-50', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={clsx('border-b border-slate-200 hover:bg-slate-50 transition-colors', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx('text-left py-3 px-4 font-semibold text-slate-900', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={clsx('py-3 px-4 text-slate-900', className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={clsx('', className)}
      {...props}
    />
  )
}
