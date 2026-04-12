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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 14l2-2M6 14l6-6M12 14l2-2M4 7.5l2-2 4 4" />
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
    { label: 'Tenancies', href: '/tenancies', icon: TenanciesIcon },
    { label: 'Documents', href: '/documents', icon: DocumentIcon },
    { label: 'Maintenance', href: '/maintenance', icon: MaintenanceIcon },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <div className="flex h-screen bg-abode-bg overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-abode-bg2 border-r border-abode-border transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b border-abode-border">
            <div className="flex items-center gap-2">
              {/* Logo - teal square with house icon */}
              <div className="w-8 h-8 bg-abode-teal rounded flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
                </svg>
              </div>
              <h1 className="font-instrument font-semibold text-abode-text">
                Landlord Portal
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <p className="text-xs font-mono uppercase tracking-[1.5px] text-abode-text3 mb-4 px-2">
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
                          ? 'bg-abode-teal-mid text-abode-teal font-medium'
                          : 'text-abode-text2 hover:text-abode-text'
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
          <div className="border-t border-abode-border px-4 py-4">
            {user && (
              <div className="mb-4 text-sm">
                <p className="text-abode-text3 text-xs font-mono uppercase tracking-[0.5px] mb-1">
                  Signed in as
                </p>
                <p className="font-medium text-abode-text truncate text-sm">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-abode-red hover:bg-abode-red/10 rounded-lg transition-colors text-sm font-medium"
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
        <header className="bg-abode-bg2 border-b border-abode-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-abode-text2 hover:text-abode-text"
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
