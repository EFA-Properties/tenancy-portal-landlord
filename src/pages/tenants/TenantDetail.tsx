import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTenant, useTenantLinkStatus, useMoveOutTenant, useRevokeAccess, useRestoreTenant } from '../../hooks/useTenants'
import { supabase } from '../../lib/supabase'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Mail, Phone, LogOut, ShieldOff, RotateCcw } from 'lucide-react'
import { formatDate } from '../../lib/utils'

function CheckCircle() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <circle cx="14" cy="14" r="14" fill="#0f766e" />
      <path d="M9 14l3 3L19 10.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyCircle() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <circle cx="14" cy="14" r="13" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  )
}

function useTenantTenancy(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-tenancy', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID')
      const { data, error } = await supabase
        .from('tenancy_tenants')
        .select('tenancy_id, tenancies(id, property_id, status, properties(address_line1, town))')
        .eq('tenant_id', tenantId)
        .limit(1)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

function useTenancyDocuments(tenancyId: string | undefined, propertyId: string | undefined) {
  return useQuery({
    queryKey: ['tenancy-documents', tenancyId, propertyId],
    queryFn: async () => {
      if (!tenancyId && !propertyId) return []
      // Get docs scoped to this tenancy OR property-level tenant docs
      const { data, error } = await supabase
        .from('documents')
        .select('id, document_type, title, valid_to, uploaded_at, served_at, tenant_opened_at, tenant_confirmed_at')
        .or(`tenancy_id.eq.${tenancyId},property_id.eq.${propertyId}`)
        .in('document_type', ['how_to_rent', 'renter_rights', 'deposit_certificate'])
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!(tenancyId || propertyId),
  })
}

function useTenantAcknowledgements(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-acknowledgements', tenantId],
    queryFn: async () => {
      if (!tenantId) return []
      const { data, error } = await supabase
        .from('document_acknowledgements')
        .select('id, document_id, served_at, opened_at, confirmed_at')
        .eq('tenant_id', tenantId)
      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
  })
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenant, isLoading } = useTenant(id)
  const { data: tenancyLink } = useTenantTenancy(id)
  const tenancy = tenancyLink?.tenancies as any
  const tenancyId = tenancy?.id
  const propertyId = tenancy?.property_id
  const { data: tenantDocs = [] } = useTenancyDocuments(tenancyId, propertyId)
  const { data: tenantAcks = [] } = useTenantAcknowledgements(id)
  const { data: linkStatus } = useTenantLinkStatus(id)

  const moveOut = useMoveOutTenant()
  const revokeAccess = useRevokeAccess()
  const restoreTenant = useRestoreTenant()

  const [showMoveOutConfirm, setShowMoveOutConfirm] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [moveOutNotes, setMoveOutNotes] = useState('')

  const isMovedOut = linkStatus?.status === 'moved_out'
  const isAccessRevoked = !!linkStatus?.access_revoked_at

  const handleMoveOut = async () => {
    if (!id || !tenancyId) return
    await moveOut.mutateAsync({ tenantId: id, tenancyId, notes: moveOutNotes || undefined })
    setShowMoveOutConfirm(false)
    setMoveOutNotes('')
  }

  const handleRevokeAccess = async () => {
    if (!id || !tenancyId) return
    await revokeAccess.mutateAsync({ tenantId: id, tenancyId })
    setShowRevokeConfirm(false)
  }

  const handleRestore = async () => {
    if (!id || !tenancyId) return
    await restoreTenant.mutateAsync({ tenantId: id, tenancyId })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!tenant) {
    return <div className="text-center py-12">Tenant not found</div>
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenants', href: '/tenants' },
          { label: tenant.full_name },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-fraunces font-bold text-slate-900">
            {tenant.full_name}
          </h1>
          {isMovedOut && <Badge variant="secondary">Moved Out</Badge>}
          {isAccessRevoked && <Badge variant="destructive">Access Revoked</Badge>}
        </div>
        <Button variant="outline" onClick={() => navigate('/tenants')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Personal Information
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-900">
                {tenant.full_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              <a href={`mailto:${tenant.email}`} className="text-teal-700 hover:text-teal-700">
                {tenant.email}
              </a>
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${tenant.phone}`} className="text-teal-700 hover:text-teal-700">
                  {tenant.phone}
                </a>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Emergency Contact
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {tenant.emergency_contact ? (
              <>
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">
                    {tenant.emergency_contact}
                  </p>
                </div>
                {tenant.emergency_phone && (
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <a href={`tel:${tenant.emergency_phone}`} className="text-teal-700 hover:text-teal-700">
                      {tenant.emergency_phone}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-600">No emergency contact provided</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tenant Actions */}
      {tenancyId && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                Tenant Actions
              </h2>
            </CardHeader>
            <CardBody>
              {isMovedOut ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-surface p-4">
                    <p className="text-sm text-textSecondary">
                      This tenant was moved out on <span className="font-medium text-textPrimary">{linkStatus?.moved_out_at ? formatDate(linkStatus.moved_out_at) : 'unknown date'}</span>.
                      {linkStatus?.move_out_notes && (
                        <span className="block mt-1 text-textMuted">Notes: {linkStatus.move_out_notes}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={handleRestore}
                      loading={restoreTenant.isPending}
                    >
                      <RotateCcw size={16} className="mr-1.5" />
                      Restore Tenant
                    </Button>
                    {!isAccessRevoked && (
                      <Button
                        variant="outline"
                        className="text-error border-error hover:bg-errorLight"
                        onClick={() => setShowRevokeConfirm(true)}
                      >
                        <ShieldOff size={16} className="mr-1.5" />
                        Revoke Portal Access
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="text-warning border-warning hover:bg-warningLight"
                    onClick={() => setShowMoveOutConfirm(true)}
                  >
                    <LogOut size={16} className="mr-1.5" />
                    Move Out
                  </Button>
                  {!isAccessRevoked ? (
                    <Button
                      variant="outline"
                      className="text-error border-error hover:bg-errorLight"
                      onClick={() => setShowRevokeConfirm(true)}
                    >
                      <ShieldOff size={16} className="mr-1.5" />
                      Revoke Portal Access
                    </Button>
                  ) : (
                    <Badge variant="destructive">Portal access revoked</Badge>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Move Out Confirmation Modal */}
      {showMoveOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Move out tenant</h3>
            <p className="text-sm text-textSecondary mb-4">
              This will mark <span className="font-medium">{tenant.full_name}</span> as moved out.
              Their documents and history will be preserved. You can optionally revoke portal access separately.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                value={moveOutNotes}
                onChange={(e) => setMoveOutNotes(e.target.value)}
                placeholder="e.g. End of fixed term, moved to new address..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowMoveOutConfirm(false); setMoveOutNotes('') }}>
                Cancel
              </Button>
              <Button
                className="bg-warning hover:bg-warning/90 text-white"
                onClick={handleMoveOut}
                loading={moveOut.isPending}
              >
                Confirm Move Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Revoke portal access</h3>
            <p className="text-sm text-textSecondary mb-4">
              This will immediately revoke <span className="font-medium">{tenant.full_name}</span>'s
              access to the tenant portal. They will no longer be able to log in, view documents, or submit maintenance requests.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRevokeConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="bg-error hover:bg-error/90 text-white"
                onClick={handleRevokeAccess}
                loading={revokeAccess.isPending}
              >
                Revoke Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Document Checklist */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Tenant Documents
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {tenancy ? (
              <>
                <div className="px-8 pt-5 pb-2">
                  <p className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">
                    Compliance documents
                  </p>
                </div>
                {[
                  { key: 'how_to_rent', label: 'How to Rent Guide', docType: 'how_to_rent' },
                  { key: 'renter_rights', label: "Renter's Rights Bill", docType: 'renter_rights' },
                  { key: 'deposit_certificate', label: 'Deposit Protection Certificate', docType: 'deposit_certificate' },
                  { key: 'right_to_rent', label: 'Right to Rent Check', docType: 'right_to_rent' },
                  { key: 'inventory', label: 'Inventory & Schedule of Condition', docType: 'inventory' },
                ].map((item) => {
                  const doc = tenantDocs.find((d: any) => d.document_type === item.docType)
                  const isComplete = !!doc
                  const ack = doc ? tenantAcks.find((a: any) => a.document_id === doc.id) : null
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-5 px-8 py-6 border-t border-slate-100"
                    >
                      {isComplete ? <CheckCircle /> : <EmptyCircle />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] font-medium ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                          {item.label}
                        </p>
                        {doc && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Uploaded {formatDate(doc.uploaded_at)}
                          </p>
                        )}
                        {/* Per-tenant acknowledgement status */}
                        {ack && (
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {ack.served_at && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-pill">
                                Served {formatDate(ack.served_at)}
                              </span>
                            )}
                            {ack.opened_at && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-pill">
                                Opened {formatDate(ack.opened_at)}
                              </span>
                            )}
                            {ack.confirmed_at ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-success bg-successLight px-2 py-0.5 rounded-pill">
                                Confirmed {formatDate(ack.confirmed_at)}
                              </span>
                            ) : ack.served_at ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-warning bg-warningLight px-2 py-0.5 rounded-pill">
                                Awaiting confirmation
                              </span>
                            ) : null}
                          </div>
                        )}
                        {doc && !ack && (
                          <p className="text-[11px] font-mono uppercase tracking-wider text-textMuted mt-1.5">
                            Not yet served to this tenant
                          </p>
                        )}
                      </div>
                      {!isComplete && item.docType === 'right_to_rent' && (
                        <a
                          href="https://www.gov.uk/landlords-immigration-check"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 rounded-md transition-colors"
                        >
                          Run Check
                        </a>
                      )}
                      {!isComplete && item.docType !== 'right_to_rent' && (
                        <Link
                          to={`/documents/upload?tenancy_id=${tenancyId}&document_type=${item.docType}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-600 rounded-md transition-colors"
                        >
                          Upload
                        </Link>
                      )}
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="px-8 py-6 text-slate-500">
                No tenancy linked — assign this tenant to a property to manage documents.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
