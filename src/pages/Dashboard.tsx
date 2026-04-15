import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useProperties } from '../hooks/useProperties'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../lib/utils'
import { useLandlord } from '../hooks/useLandlord'

function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#0f766e" />
      <path d="M7 11l2.5 2.5L15 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" stroke="#d1d5db" strokeWidth="1.5" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()
  const { data: properties = [] } = useProperties()
  const { data: landlord } = useLandlord()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label: 'Active Tenancies', value: stats?.activeTenancies ?? 0, color: 'text-teal-700' },
    { label: 'Properties', value: properties.length, color: 'text-slate-900' },
    { label: 'Pending', value: stats?.pendingRequests ?? 0, color: 'text-warning' },
    { label: 'Alerts', value: stats?.overdueAlerts ?? 0, color: 'text-error' },
  ]

  const complianceItems = [
    {
      title: 'Gas Safety Certificate (CP12)',
      description: 'Annual renewal · Tenant must receive each year',
      done: true,
    },
    {
      title: 'EPC Certificate',
      description: 'Minimum C rating required from 2028',
      done: true,
    },
    {
      title: 'EICR (Electrical Safety)',
      description: 'Every 5 years · Required before letting',
      done: false,
    },
    {
      title: 'How to Rent Guide',
      description: 'Gov.uk · Must be current edition',
      done: false,
    },
    {
      title: "Renter's Rights Bill",
      description: 'Renters Reform Bill documentation',
      done: false,
    },
    {
      title: 'Deposit Protection Certificate',
      description: 'DPS / TDS / MyDeposits · Within 30 days',
      done: false,
    },
  ]

  return (
    <div>
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-fraunces font-semibold text-slate-900 mb-1">
          {greeting}, <em className="font-fraunces italic text-teal-700 not-italic">{firstName}</em>
        </h1>
        <p className="text-slate-500 text-[15px]">
          Here's an overview of your portfolio.
        </p>
      </div>

      {/* Free plan banner */}
      {landlord && landlord.plan === 'free' && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-teal-900">
              You're on the Free plan — limited to 1 property and date logging only.
            </p>
            <p className="text-xs text-teal-700 mt-0.5">
              Upgrade to unlock document delivery, compliance alerts, and audit reports.
            </p>
          </div>
          <Link
            to="/settings"
            className="shrink-0 ml-4 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-600 transition-colors"
          >
            Upgrade to Pro — £29.99/mo
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="!py-5 !px-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {isLoading ? '–' : stat.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compliance checklist — spans 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
                Compliance
              </p>
              <h2 className="text-xl font-fraunces font-semibold text-slate-900">
                Every document.{' '}
                <em className="font-fraunces italic text-teal-700">Provably delivered.</em>
              </h2>
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {complianceItems.map((item) => (
              <div key={item.title} className="flex items-start gap-4 px-8 py-5">
                <div className="mt-0.5 shrink-0">
                  {item.done ? <CheckCircle /> : <EmptyCircle />}
                </div>
                <div>
                  <p className="text-body font-medium text-textPrimary">{item.title}</p>
                  <p className="text-small text-textMuted mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick actions — spans 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-5">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Add Property', href: '/properties/new', desc: 'Register a new property' },
                  { label: 'Add Tenancy', href: '/tenancies/new', desc: 'Create a new tenancy' },
                  { label: 'Invite Tenant', href: '/tenants/invite', desc: 'Send an invitation' },
                  { label: 'Upload Document', href: '/documents/upload', desc: 'CP12, EPC, EICR, etc.' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{action.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
                    </div>
                    <div className="text-slate-300 group-hover:text-teal-600 transition-colors">
                      <ArrowRight />
                    </div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent Properties */}
          {properties.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-5">
                  Recent Properties
                </h3>
                <div className="space-y-1">
                  {properties.slice(0, 4).map((prop) => (
                    <Link
                      key={prop.id}
                      to={`/properties/${prop.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {prop.address_line1}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {prop.town}{prop.postcode ? ` · ${prop.postcode}` : ''}
                        </p>
                      </div>
                      {prop.epc_rating && (
                        <Badge
                          size="sm"
                          variant={
                            ['A', 'B', 'C'].includes(prop.epc_rating?.toUpperCase())
                              ? 'success'
                              : 'warning'
                          }
                        >
                          EPC {prop.epc_rating}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
