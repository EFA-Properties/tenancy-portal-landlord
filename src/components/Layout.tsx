import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 10l8-8 8 8M4 9v8c0 .553.447 1 1 1h10c.553 0 1-.447 1-1V9" />
    </svg>
  )
}

function TenanciesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3h10v14H4V3M8 7h4M8 11h4M8 15h2" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3h10v14H4V3M8 7h4M8 11h4M8 15h2" />
    </svg>
  )
}

function MaintenanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function PropertiesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l7-7 7 7M5 8v8a1 1 0 001 1h8a1 1 0 001-1V8" />
      <path d="M8 17v-5h4v5" />
    </svg>
  )
}

function TenantsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3" />
      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 12.5c1.378 0 2.5-1.122 2.5-2.5S11.378 7.5 10 7.5 7.5 8.622 7.5 10 8.622 12.5 10 12.5M10 2v2M10 16v2M2 10h2M16 10h2M4 4l1.414 1.414M14.586 14.586L16 16M4 16l1.414-1.414M14.586 5.414L16 4" />
    </svg>
  )
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { label: 'Properties', href: '/properties', icon: PropertiesIcon },
    { label: 'Tenancies', href: '/tenancies', icon: TenanciesIcon },
    { label: 'Tenants', href: '/tenants', icon: TenantsIcon },
    { label: 'Documents', href: '/documents', icon: DocumentIcon },
    { label: 'Maintenance', href: '/maintenance', icon: WrenchIcon },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {/* Logo - teal square with house icon */}
              <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
                </svg>
              </div>
              <h1 className="font-fraunces font-semibold text-white">
                TenancyPortal
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <p className="text-xs font-mono uppercase tracking-[1.5px] text-slate-500 mb-4 px-2">
              Navigation
            </p>
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const ItemIcon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-teal-600 text-white font-medium'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <ItemIcon />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className="border-t border-slate-800 px-4 py-4">
            {user && (
              <div className="mb-4 text-sm">
                <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.5px] mb-1">
                  Signed in as
                </p>
                <p className="font-medium text-white truncate text-sm">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 h-16 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto scroll-area">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
