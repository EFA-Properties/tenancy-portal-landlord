import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTenant } from '../../hooks/useTenants'
import { supabase } from '../../lib/supabase'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Mail, Phone } from 'lucide-react'
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
          { label: `${tenant.first_name} ${tenant.last_name}` },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {tenant.first_name} {tenant.last_name}
        </h1>
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
                {tenant.first_name} {tenant.last_name}
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
                      {!isComplete && (
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
