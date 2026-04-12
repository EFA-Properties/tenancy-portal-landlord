import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Building2,
  FileText,
  Users,
  CheckSquare,
  Wrench,
  AlertCircle,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Building2, label: 'Properties', href: '/properties' },
    { icon: FileText, label: 'Tenancies', href: '/tenancies' },
    { icon: Users, label: 'Tenants', href: '/tenants' },
    { icon: CheckSquare, label: 'Documents', href: '/documents' },
    { icon: AlertCircle, label: 'Compliance', href: '/compliance' },
    { icon: Wrench, label: 'Maintenance', href: '/maintenance' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const isActive = (href: string) => location.pathname.startsWith(href)

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 fixed h-screen overflow-y-auto z-40`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-700 rounded-md flex items-center justify-center text-white font-bold font-fraunces">
              TP
            </div>
            {sidebarOpen && (
              <span className="font-fraunces font-bold text-slate-900">
                Tenancy
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-500">Landlord</p>
                </div>

                <button
                  onClick={() => signOut()}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-1"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
