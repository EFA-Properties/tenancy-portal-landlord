import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l7-7 7 7M5 8.5v8c0 .28.22.5.5.5h3.5v-4h2v4h3.5c.28 0 .5-.22.5-.5v-8" />
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

function TenanciesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="12" height="14" rx="1" />
      <path d="M8 7h4M8 10h4M8 13h2" />
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

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M12 3v4h4" />
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

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4 4l1.414 1.414M14.586 14.586L16 16M4 16l1.414-1.414M14.586 5.414L16 4" />
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
    { label: 'Messages', href: '/messages', icon: MessageIcon },
    { label: 'Maintenance', href: '/maintenance', icon: WrenchIcon },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f9fb' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-slate-900 transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
                </svg>
              </div>
              <span className="font-fraunces font-semibold text-white text-[17px]">
                TenancyPortal
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 overflow-y-auto">
            <ul className="space-y-0.5">
              {navigationItems.map((item) => {
                const ItemIcon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] transition-all ${
                        active
                          ? 'bg-teal-600/90 text-white font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
          <div className="border-t border-slate-800/60 px-4 py-4">
            {user && (
              <div className="mb-3 px-2">
                <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-0.5">
                  Signed in as
                </p>
                <p className="font-medium text-slate-300 truncate text-sm">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all text-sm"
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
        <header className="bg-white/80 backdrop-blur-md border-b border-border px-8 h-16 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-500 hover:text-slate-900"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex-1" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto scroll-area">
          <div className="px-8 py-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
