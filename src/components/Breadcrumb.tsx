import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

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
            <ChevronRight size={16} className="text-abode-text3" />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="text-abode-teal hover:text-abode-text text-sm font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-abode-text2 text-sm font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
