import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useProperties } from '../hooks/useProperties'
import { useDocuments } from '../hooks/useDocuments'
import { useDashboardActions, type DashboardAction } from '../hooks/useDashboardActions'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useLandlord } from '../hooks/useLandlord'
import { formatDate, formatDateTime } from '../lib/utils'
import { supabase } from '../lib/supabase'

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

const docTypeLabels: Record<string, string> = {
  ast: 'Tenancy Agreement',
  epc: 'EPC Certificate',
  gas_safety: 'Gas Safety Certificate (CP12)',
  eicr: 'EICR (Electrical Safety)',
  inventory: 'Inventory & Schedule of Condition',
  deposit_certificate: 'Deposit Protection Certificate',
  how_to_rent: 'How to Rent Guide',
  renter_rights: "Renter's Rights",
  right_to_rent: 'Right to Rent Check',
  hmo_licence: 'HMO Licence',
  emergency_lighting: 'Emergency Lighting Report',
  fire_risk_assessment: 'Fire Risk Assessment',
  fire_emergency_procedures: 'Fire & Emergency Procedures',
  house_rules: 'House Rules / Guidance',
  other: 'Other Document',
}

function CheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <circle cx="11" cy="11" r="11" fill="#0f766e" />
      <path d="M7 11l2.5 2.5L15 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()
  const { data: properties = [] } = useProperties()
  const { data: landlord } = useLandlord()
  const { data: actions = [], isLoading: actionsLoading } = useDashboardActions()
  const { data: documents = [], isLoading: docsLoading } = useDocuments()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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
                <div className="flex items-center gap-2">
                  {urgentActions.length > 0 && (
                    <Badge variant="destructive">{urgentActions.length} URGENT</Badge>
                  )}
                  {warningActions.length > 0 && (
                    <Badge variant="warning">{warningActions.length} WARNING</Badge>
                  )}
                  {infoActions.length > 0 && (
                    <Badge variant="default">{infoActions.length} INFO</Badge>
                  )}
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

      {/* Recent Documents Table */}
      {documents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
                  Document Vault
                </p>
                <h2 className="text-xl font-fraunces font-semibold text-slate-900">
                  Recent Documents
                </h2>
              </div>
              <Link to="/documents">
                <Badge variant="secondary" size="sm">View all</Badge>
              </Link>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Document</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Property</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Uploaded</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Tenant Accepted</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Valid To</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.slice(0, 10).map((doc: any) => {
                  let statusLabel = 'Uploaded'
                  let statusColor = 'text-textMuted bg-slate-100'
                  if (doc.tenant_confirmed_at) {
                    statusLabel = 'Accepted'
                    statusColor = 'text-success bg-successLight'
                  } else if (doc.tenant_opened_at) {
                    statusLabel = 'Viewed'
                    statusColor = 'text-blue-700 bg-blue-50'
                  } else if (doc.served_at) {
                    statusLabel = 'Served'
                    statusColor = 'text-teal-700 bg-teal-50'
                  }

                  const propertyName = doc.properties
                    ? `${doc.properties.address_line1}, ${doc.properties.town}`
                    : '—'

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle />
                          <div className="min-w-0">
                            <p className="font-medium text-textPrimary truncate">
                              {doc.title || docTypeLabels[doc.document_type] || doc.file_name || 'Untitled'}
                            </p>
                            <span className="text-xs text-textMuted">
                              {docTypeLabels[doc.document_type] || doc.document_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-textSecondary whitespace-nowrap text-xs">
                        {propertyName}
                      </td>
                      <td className="px-4 py-4 text-textSecondary whitespace-nowrap">
                        {formatDateTime(doc.uploaded_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {doc.tenant_confirmed_at ? (
                          <span className="text-success font-medium">{formatDateTime(doc.tenant_confirmed_at)}</span>
                        ) : (
                          <span className="text-textMuted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {doc.valid_to ? (
                          <span className={new Date(doc.valid_to) < new Date() ? 'text-error font-medium' : 'text-textSecondary'}>
                            {formatDate(doc.valid_to)}
                            {new Date(doc.valid_to) < new Date() && ' (expired)'}
                          </span>
                        ) : (
                          <span className="text-textMuted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-pill ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setDownloadingId(doc.id)
                            try {
                              if (doc.file_path?.startsWith('http')) {
                                window.open(doc.file_path, '_blank')
                              } else {
                                const bucket = doc.scope === 'property' ? 'property-documents' : 'tenancy-documents'
                                const { data, error } = await supabase.storage.from(bucket).createSignedUrl(doc.file_path, 3600)
                                if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank')
                              }
                            } finally {
                              setDownloadingId(null)
                            }
                          }}
                          loading={downloadingId === doc.id}
                        >
                          {doc.file_path?.startsWith('http') ? 'View' : 'Download'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
