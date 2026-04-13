import React from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 mb-6">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-slate-300">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="text-slate-400 hover:text-teal-700 text-sm transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700 text-sm font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
