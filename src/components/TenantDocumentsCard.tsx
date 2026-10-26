import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from './ui/Card'
import { openSignedCopy } from '../lib/receipts'
import { formatDateTime } from '../lib/utils'

interface Doc {
  id: string
  scope: string
  tenancy_id: string | null
  document_type: string
  title: string
  tenant_visible: boolean | null
}

interface Acknowledgement {
  id: string
  document_id: string
  tenant_id: string
  served_at: string | null
  opened_at: string | null
  confirmed_at: string | null
  receipt_file_path: string | null
}

interface PropertyTenant {
  tenant_id: string
  tenancy_id: string
  tenants: { id: string; full_name: string } | null
}

interface Props {
  tenants: PropertyTenant[]
  documents: Doc[]
  acknowledgements: Acknowledgement[]
  overrides: Record<string, string>
  docTypeLabels: Record<string, string>
}

// One expandable row per tenant listing every document they can see in the tenant portal,
// with whether it has been sent to them, opened and accepted.
export function TenantDocumentsCard({ tenants, documents, acknowledgements, overrides, docTypeLabels }: Props) {
  if (!tenants.length) return null

  // What a tenant sees: the latest visible version of each document type for the property
  // plus their own tenancy, and every "other" document. Right to Rent records stay with the landlord.
  const docsForTenancy = (tenancyId: string) => {
    const seen = new Set<string>()
    return documents.filter((d) => {
      if (d.tenant_visible === false || d.document_type === 'right_to_rent') return false
      if (overrides[d.document_type] === 'na') return false
      if (d.scope === 'tenancy' && d.tenancy_id !== tenancyId) return false
      if (d.document_type === 'other') return true
      if (seen.has(d.document_type)) return false
      seen.add(d.document_type)
      return true
    })
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">Tenants</p>
        <h2 className="text-lg font-fraunces font-semibold text-slate-900">Documents for each tenant</h2>
        <p className="text-sm text-slate-500 mt-1">Click a tenant to see which documents they have opened and accepted.</p>
      </CardHeader>
      <div className="divide-y divide-border">
        {tenants.map((pt) => {
          const docs = docsForTenancy(pt.tenancy_id)
          const ackFor = (docId: string) =>
            acknowledgements.find((a) => a.document_id === docId && a.tenant_id === pt.tenant_id)
          const accepted = docs.filter((d) => ackFor(d.id)?.confirmed_at).length

          return (
            <details key={`${pt.tenancy_id}-${pt.tenant_id}`} className="group">
              <summary className="flex items-center justify-between px-8 py-4 cursor-pointer list-none hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                    <path d="M8 5l5 5-5 5" />
                  </svg>
                  <span className="font-medium text-slate-900">{pt.tenants?.full_name || 'Tenant'}</span>
                </div>
                <span className={`text-xs font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  docs.length > 0 && accepted === docs.length ? 'text-success bg-successLight' : 'text-amber-600 bg-amber-50'
                }`}>
                  {accepted} of {docs.length} accepted
                </span>
              </summary>
              <div className="px-8 pb-5">
                {docs.length === 0 ? (
                  <p className="text-sm text-slate-400 pl-7">No documents for this tenant yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {docs.map((d) => {
                        const ack = ackFor(d.id)
                        let status = 'Not sent yet'
                        let color = 'text-textMuted bg-slate-100'
                        if (ack?.confirmed_at) {
                          status = 'Accepted'
                          color = 'text-success bg-successLight'
                        } else if (ack?.opened_at) {
                          status = 'Opened'
                          color = 'text-blue-700 bg-blue-50'
                        } else if (ack?.served_at) {
                          status = 'Sent'
                          color = 'text-teal-700 bg-teal-50'
                        }
                        return (
                          <tr key={d.id}>
                            <td className="py-3 pl-7 pr-3 text-slate-800">{d.title || docTypeLabels[d.document_type] || 'Document'}</td>
                            <td className="py-3 px-3 whitespace-nowrap text-textSecondary">
                              {ack?.confirmed_at ? formatDateTime(ack.confirmed_at) : ack?.opened_at ? formatDateTime(ack.opened_at) : ''}
                              {ack?.receipt_file_path && (
                                <button
                                  onClick={() => openSignedCopy(ack.receipt_file_path!)}
                                  className="block text-xs text-teal-700 hover:text-teal-600 underline mt-1"
                                >
                                  Signed copy
                                </button>
                              )}
                            </td>
                            <td className="py-3 pl-3 text-right whitespace-nowrap">
                              <span className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${color}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
                <Link to={`/tenancies/${pt.tenancy_id}`} className="inline-block mt-3 pl-7 text-xs font-medium text-teal-700 hover:text-teal-800">
                  Open tenancy ›
                </Link>
              </div>
            </details>
          )
        })}
      </div>
    </Card>
  )
}
