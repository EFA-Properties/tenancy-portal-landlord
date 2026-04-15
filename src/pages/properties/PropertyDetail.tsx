import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProperty, usePropertyTenancies, usePropertyDocuments } from '../../hooks/useProperties'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatDate, epcRatingColor } from '../../lib/utils'

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

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(id)
  const { data: tenancies = [], isLoading: tenanciesLoading } = usePropertyTenancies(id)
  const { data: propertyDocs = [] } = usePropertyDocuments(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!property) {
    return <div className="text-center py-12 text-slate-500">Property not found</div>
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Properties', href: '/properties' },
          { label: `${property.address_line1}, ${property.town}` },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
            {property.address_line1}, {property.town}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {property.property_type && (
              <Badge variant="outline" size="sm">
                {property.property_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Badge>
            )}
            {property.is_hmo && (
              <Badge variant="secondary" size="sm">HMO</Badge>
            )}
            {(property as any).legal_entities && (
              <Badge variant="default" size="sm">
                {(property as any).legal_entities.name}
              </Badge>
            )}
            <span className="text-sm text-slate-400">{property.postcode}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/properties')}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property details */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Address
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-body text-textSecondary leading-relaxed">
              {property.address_line1}
              {property.address_line2 ? <><br />{property.address_line2}</> : null}
              <br />{property.town}
              {property.county ? <><br />{property.county}</> : null}
              <br />{property.postcode}
            </p>
          </CardBody>
        </Card>

        {/* EPC & Compliance */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              EPC & Compliance
            </h2>
          </CardHeader>
          <CardBody>
            {property.epc_rating ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                    style={{
                      backgroundColor: ['A', 'B'].includes(property.epc_rating.toUpperCase()) ? '#0f766e'
                        : property.epc_rating.toUpperCase() === 'C' ? '#0d9488'
                        : property.epc_rating.toUpperCase() === 'D' ? '#d97706'
                        : '#dc2626'
                    }}
                  >
                    {property.epc_rating}
                  </div>
                  <div>
                    <p className="text-body font-medium text-textPrimary">
                      EPC Rating {property.epc_rating}
                      {property.epc_score ? ` (${property.epc_score})` : ''}
                    </p>
                    {property.epc_expiry && (
                      <p className="text-sm text-slate-400 mt-0.5">
                        Valid to {formatDate(property.epc_expiry)}
                      </p>
                    )}
                  </div>
                </div>
                {property.uprn && (
                  <a
                    href={`https://find-energy-certificate.service.gov.uk/energy-certificate/${property.uprn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Full EPC Certificate
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No EPC data available.</p>
            )}
          </CardBody>
        </Card>

        {/* Compliance checklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">Compliance</p>
                <h2 className="text-lg font-fraunces font-semibold text-slate-900">
                  Document checklist
                </h2>
              </div>
              <Link to={`/documents?property_id=${property.id}`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {(() => {
              const getDoc = (type: string) => propertyDocs.find((d) => d.document_type === type)
              const hasDocType = (type: string) => propertyDocs.some((d) => d.document_type === type)
              const getDocExpiry = (type: string) => getDoc(type)?.valid_to || null

              const propertyItems = [
                { title: 'Gas Safety Certificate (CP12)', desc: 'Annual renewal · Tenant must receive each year', docType: 'gas_safety', hasIt: !!property.gas_safety_expiry || hasDocType('gas_safety'), expiry: property.gas_safety_expiry || getDocExpiry('gas_safety') },
                { title: 'EPC Certificate', desc: 'Minimum C rating required from 2028', docType: 'epc', hasIt: !!property.epc_rating || hasDocType('epc'), expiry: property.epc_expiry || getDocExpiry('epc') },
                { title: 'EICR (Electrical Safety)', desc: 'Every 5 years · Required before letting', docType: 'eicr', hasIt: !!property.eicr_expiry || hasDocType('eicr'), expiry: property.eicr_expiry || getDocExpiry('eicr') },
              ]

              const tenantItems = [
                { title: 'How to Rent Guide', desc: 'Gov.uk · Must be current edition', docType: 'how_to_rent', hasIt: hasDocType('how_to_rent'), expiry: getDocExpiry('how_to_rent') },
                { title: "Renter's Rights Bill", desc: 'Renters Reform Bill documentation', docType: 'renter_rights', hasIt: hasDocType('renter_rights'), expiry: getDocExpiry('renter_rights') },
                { title: 'Deposit Protection Certificate', desc: 'DPS / TDS / MyDeposits · Within 30 days', docType: 'deposit_certificate', hasIt: hasDocType('deposit_certificate'), expiry: getDocExpiry('deposit_certificate') },
              ]

              const items = [...propertyItems, ...tenantItems]

              const renderSection = (sectionItems: typeof items, label: string) => (
                <>
                  <div className="px-8 pt-5 pb-2">
                    <p className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">{label}</p>
                  </div>
                  {sectionItems.map((item) => {
                const doc = getDoc(item.docType)
                return (
                  <div key={item.title} className="flex items-center gap-5 px-8 py-6">
                    {item.hasIt ? <CheckCircle /> : <EmptyCircle />}
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-textPrimary">{item.title}</p>
                      <p className="text-sm text-textMuted mt-1">{item.desc}</p>
                      {/* Tenant activity tracking */}
                      {doc && item.hasIt && (
                        <div className="flex items-center gap-3 mt-2">
                          {doc.served_at ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-pill">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#0f766e" /><path d="M3 5l1.5 1.5L7 4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              Served {formatDate(doc.served_at)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-textMuted bg-surface px-2 py-0.5 rounded-pill">
                              Not served
                            </span>
                          )}
                          {doc.served_at && (
                            <>
                              {doc.tenant_opened_at ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-pill">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#0f766e" strokeWidth="1" fill="none" /><circle cx="5" cy="5" r="2" fill="#0f766e" /></svg>
                                  Opened {formatDate(doc.tenant_opened_at)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-warning bg-warningLight px-2 py-0.5 rounded-pill">
                                  Not opened
                                </span>
                              )}
                              {doc.tenant_confirmed_at ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-success bg-successLight px-2 py-0.5 rounded-pill">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#15803d" /><path d="M3 5l1.5 1.5L7 4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  Confirmed {formatDate(doc.tenant_confirmed_at)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-textMuted bg-surface px-2 py-0.5 rounded-pill">
                                  Not confirmed
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.hasIt && item.expiry && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
                          Valid to {formatDate(item.expiry)}
                        </span>
                      )}
                      {item.hasIt && !item.expiry && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
                          Uploaded
                        </span>
                      )}
                      {!item.hasIt && (
                        <Link to={`/documents/upload?property_id=${property.id}&document_type=${item.docType}`}>
                          <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-600 transition-colors shadow-sm">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M7 1v12M1 7h12" />
                            </svg>
                            Upload
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
                </>
              )

              return (
                <>
                  {renderSection(propertyItems, 'Property documents')}
                  {renderSection(tenantItems, 'Tenant documents')}
                </>
              )
            })()}
          </div>
        </Card>

        {/* Tenancies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Tenancies
              </h2>
              <Link to="/tenancies/new">
                <Button size="sm">Add Tenancy</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {tenanciesLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
              </div>
            ) : tenancies.length === 0 ? (
              <p className="text-sm text-slate-400">No tenancies for this property yet.</p>
            ) : (
              <div className="space-y-3">
                {tenancies.map((tenancy: any) => (
                  <Link key={tenancy.id} to={`/tenancies/${tenancy.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {tenancy.tenants ? tenancy.tenants.full_name : 'No tenant linked'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          £{tenancy.monthly_rent.toFixed(2)}/month · Started {formatDate(tenancy.start_date)}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        variant={
                          tenancy.status === 'active'
                            ? 'success'
                            : tenancy.status === 'pending'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Actions */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to={`/documents?property_id=${property.id}`}>
                <Button variant="outline" className="w-full">
                  View Property Documents
                </Button>
              </Link>
              <Link to={`/maintenance?property_id=${property.id}`}>
                <Button variant="outline" className="w-full">
                  Maintenance Requests
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
