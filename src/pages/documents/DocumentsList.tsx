import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDocuments } from '../../hooks/useDocuments'
import { supabase } from '../../lib/supabase'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate, formatDateTime } from '../../lib/utils'
import { FeatureGate } from '../../components/FeatureGate'

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

// Which doc types are visible to tenants
const tenantVisibleTypes = new Set([
  'ast', 'epc', 'gas_safety', 'eicr', 'how_to_rent',
  'deposit_certificate', 'renter_rights', 'inventory',
])

// Which doc types are landlord-only
const landlordOnlyTypes = new Set(['right_to_rent'])

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <rect x="4" y="2" width="14" height="18" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M8 8h6M8 12h4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <circle cx="11" cy="11" r="11" fill="#0f766e" />
      <path d="M7 11l2.5 2.5L15 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DocumentsList() {
  const [searchParams] = useSearchParams()
  const tenancyId = searchParams.get('tenancy_id') || undefined
  const propertyId = searchParams.get('property_id') || undefined
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [filterScope, setFilterScope] = useState<'all' | 'property' | 'tenancy'>('all')

  const { data: documents = [], isLoading } = useDocuments({
    tenancy_id: tenancyId,
    property_id: propertyId,
  })

  const filteredDocs = filterScope === 'all'
    ? documents
    : documents.filter((d: any) => d.scope === filterScope)

  // Group documents by property
  const grouped = filteredDocs.reduce((acc: Record<string, any[]>, doc: any) => {
    const key = doc.properties
      ? `${doc.properties.address_line1}, ${doc.properties.town}`
      : 'Unlinked Documents'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {} as Record<string, any[]>)

  const handleDownload = async (doc: any) => {
    setDownloadingId(doc.id)
    try {
      if (doc.file_path?.startsWith('http://') || doc.file_path?.startsWith('https://')) {
        window.open(doc.file_path, '_blank')
        return
      }
      const bucket = doc.scope === 'property' ? 'property-documents' : 'tenancy-documents'
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(doc.file_path, 3600)
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
            Document Vault
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </p>
        </div>
        <Link to="/documents/upload">
          <Button>Upload Document</Button>
        </Link>
      </div>

      {/* Scope filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'property', 'tenancy'] as const).map((scope) => (
          <button
            key={scope}
            onClick={() => setFilterScope(scope)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterScope === scope
                ? 'bg-teal-700 text-white'
                : 'bg-white text-textSecondary border border-border hover:bg-slate-50'
            }`}
          >
            {scope === 'all' ? 'All Documents' : scope === 'property' ? 'Property' : 'Tenancy'}
          </button>
        ))}
      </div>

      {filteredDocs.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No documents yet"
              description="Upload your first document to get started with your document vault."
              action={{ label: 'Upload Document', onClick: () => window.location.href = '/documents/upload' }}
            />
          </CardBody>
        </Card>
      ) : (
        Object.entries(grouped).map(([propertyName, docs]) => (
          <Card key={propertyName} className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest mb-1">
                    {(docs as any[])[0]?.scope === 'property' ? 'Property' : 'Tenancy'}
                  </p>
                  <h2 className="text-base font-semibold text-slate-900">{propertyName}</h2>
                </div>
                <Badge variant="secondary" size="sm">
                  {(docs as any[]).length} {(docs as any[]).length === 1 ? 'doc' : 'docs'}
                </Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Document</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Uploaded</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Tenant Accepted</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Valid To</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(docs as any[]).map((doc: any) => {
                    const isLandlordOnly = landlordOnlyTypes.has(doc.document_type)
                    const isTenantVisible = tenantVisibleTypes.has(doc.document_type)

                    // Determine status
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

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Document name & type */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle />
                            <div className="min-w-0">
                              <p className="font-medium text-textPrimary truncate">
                                {doc.title || docTypeLabels[doc.document_type] || doc.file_name || 'Untitled'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-textMuted">
                                  {docTypeLabels[doc.document_type] || doc.document_type}
                                </span>
                                {isTenantVisible && (
                                  <span className="text-[9px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-pill">
                                    Tenant
                                  </span>
                                )}
                                {isLandlordOnly && (
                                  <span className="text-[9px] font-mono uppercase tracking-wider text-textMuted bg-surface px-1.5 py-0.5 rounded-pill">
                                    Private
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Uploaded date/time */}
                        <td className="px-4 py-4 text-textSecondary whitespace-nowrap">
                          {formatDateTime(doc.uploaded_at)}
                        </td>

                        {/* Tenant accepted date/time */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {doc.tenant_confirmed_at ? (
                            <span className="text-success font-medium">{formatDateTime(doc.tenant_confirmed_at)}</span>
                          ) : (
                            <span className="text-textMuted">—</span>
                          )}
                        </td>

                        {/* Valid to */}
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

                        {/* Status badge */}
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-pill ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
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
        ))
      )}
    </div>
  )
}
