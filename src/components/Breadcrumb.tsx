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
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight size={16} className="text-slate-400" />}
          {item.href ? (
            <Link to={item.href} className="text-teal-700 hover:text-teal-800 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-500">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
