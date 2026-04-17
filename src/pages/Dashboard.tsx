import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useProperties } from '../hooks/useProperties'
import { useDashboardActions, type DashboardAction } from '../hooks/useDashboardActions'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useLandlord } from '../hooks/useLandlord'

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

function PriorityIcon({ priority }: { priority: DashboardAction['priority'] }) {
  if (priority === 'urgent') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 5v3M8 10.5v.5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5" />
        </svg>
      </div>
    )
  }
  if (priority === 'warning') {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 5.5v3M8 10.5v.5" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M7.13 2.5L1.5 12.5h13L8.87 2.5H7.13z" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M8 7v4M8 5v.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()
  const { data: properties = [] } = useProperties()
  const { data: landlord } = useLandlord()
  const { data: actions = [], isLoading: actionsLoading } = useDashboardActions()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const urgentActions = actions.filter((a) => a.priority === 'urgent')
  const warningActions = actions.filter((a) => a.priority === 'warning')
  const infoActions = actions.filter((a) => a.priority === 'info')

  const statCards = [
    { label: 'Active Tenancies', value: stats?.activeTenancies ?? 0, color: 'text-teal-700' },
    { label: 'Properties', value: properties.length, color: 'text-slate-900' },
    { label: 'Pending', value: stats?.pendingRequests ?? 0, color: 'text-warning' },
    { label: 'Actions', value: actions.length, color: actions.some((a) => a.priority === 'urgent') ? 'text-error' : 'text-warning' },
  ]

  const renderAction = (action: DashboardAction) => (
    <Link
      key={action.id}
      to={action.link}
      className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group"
    >
      <PriorityIcon priority={action.priority} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
          {action.title}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
        <p className="text-xs text-slate-300 mt-1 truncate">{action.propertyAddress}</p>
      </div>
      <div className="text-slate-200 group-hover:text-teal-600 transition-colors mt-1 shrink-0">
        <ArrowRight />
      </div>
    </Link>
  )

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
        {/* Action feed — spans 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
                  Action Required
                </p>
                <h2 className="text-xl font-fraunces font-semibold text-slate-900">
                  {actions.length === 0 ? (
                    <>All clear <span className="text-teal-600">— nothing to action</span></>
                  ) : (
                    <>{actions.length} item{actions.length !== 1 ? 's' : ''} need{actions.length === 1 ? 's' : ''} attention</>
                  )}
                </h2>
              </div>
              {actions.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {(() => {
                    const expired = actions.filter((a) => a.category === 'expiry' && a.priority === 'urgent').length
                    const expiring = actions.filter((a) => a.category === 'expiry' && a.priority !== 'urgent').length
                    const missing = actions.filter((a) => a.category === 'missing_doc').length
                    const tenantActions = actions.filter((a) => a.category === 'tenant').length
                    const parts: string[] = []
                    if (expired) parts.push(`${expired} expired`)
                    if (expiring) parts.push(`${expiring} expiring`)
                    if (missing) parts.push(`${missing} missing doc${missing !== 1 ? 's' : ''}`)
                    if (tenantActions) parts.push(`${tenantActions} tenant${tenantActions !== 1 ? 's' : ''}`)
                    return <span>{parts.join(' · ')}</span>
                  })()}
                </div>
              )}
            </div>
          </CardHeader>

          {actionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
            </div>
          ) : actions.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#0f766e" strokeWidth="2" />
                  <path d="M8 12l2.5 2.5L16 9" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">You're all caught up</p>
              <p className="text-xs text-slate-400">
                No expiring certificates, missing documents, or tenant actions needed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Urgent section */}
              {urgentActions.length > 0 && (
                <>
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-[10px] font-mono font-medium text-red-500 uppercase tracking-widest">
                      Requires immediate action
                    </p>
                  </div>
                  {urgentActions.map(renderAction)}
                </>
              )}

              {/* Warning section */}
              {warningActions.length > 0 && (
                <>
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-[10px] font-mono font-medium text-amber-600 uppercase tracking-widest">
                      Upcoming / Missing
                    </p>
                  </div>
                  {warningActions.map(renderAction)}
                </>
              )}

              {/* Info section */}
              {infoActions.length > 0 && (
                <>
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-[10px] font-mono font-medium text-blue-500 uppercase tracking-widest">
                      Coming up
                    </p>
                  </div>
                  {infoActions.map(renderAction)}
                </>
              )}
            </div>
          )}
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
