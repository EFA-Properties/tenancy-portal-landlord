import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useProperty, usePropertyTenancies, usePropertyDocuments, useDocumentAcknowledgements, usePropertyTenants } from '../../hooks/useProperties'
import { useRightToRentByProperty } from '../../hooks/useRightToRent'
import { supabase } from '../../lib/supabase'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { formatDate, formatDateTime, epcRatingColor } from '../../lib/utils'

interface PropertyRoom {
  id: string
  property_id: string
  room_label: string
  floor: number | null
  notes: string | null
}

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
  const { data: propertyTenants = [] } = usePropertyTenants(id)
  const { data: rtrChecks = [] } = useRightToRentByProperty(id)
  const docIds = propertyDocs.map((d) => d.id)
  const { data: acknowledgements = [] } = useDocumentAcknowledgements(docIds)
  const queryClient = useQueryClient()
  const [servingDoc, setServingDoc] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // HMO Rooms
  const [rooms, setRooms] = useState<PropertyRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [newRoomLabel, setNewRoomLabel] = useState('')
  const [addingRoom, setAddingRoom] = useState(false)
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null)

  const isHmo = property ? (property.is_hmo || property.property_type === 'hmo') : false

  const loadRooms = useCallback(async () => {
    if (!id) return
    setRoomsLoading(true)
    try {
      const { data, error } = await supabase
        .from('property_rooms')
        .select('*')
        .eq('property_id', id)
        .order('room_label')
      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      console.error('Error loading rooms:', err)
    } finally {
      setRoomsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (isHmo && id) loadRooms()
  }, [isHmo, id, loadRooms])

  const addRoom = async () => {
    if (!newRoomLabel.trim() || !id) return
    setAddingRoom(true)
    try {
      const { error } = await supabase
        .from('property_rooms')
        .insert({ property_id: id, room_label: newRoomLabel.trim() })
      if (error) throw error
      setNewRoomLabel('')
      await loadRooms()
    } catch (err) {
      console.error('Error adding room:', err)
    } finally {
      setAddingRoom(false)
    }
  }

  const deleteRoom = async (roomId: string) => {
    setDeletingRoom(roomId)
    try {
      const { error } = await supabase
        .from('property_rooms')
        .delete()
        .eq('id', roomId)
      if (error) throw error
      await loadRooms()
    } catch (err) {
      console.error('Error deleting room:', err)
    } finally {
      setDeletingRoom(null)
    }
  }

  // Compliance overrides (N/A)
  const overrides: Record<string, string> = (property as any)?.compliance_overrides || {}

  const toggleOverride = async (docType: string) => {
    if (!id || !property) return
    const currentOverrides = { ...(property as any).compliance_overrides || {} }

    if (currentOverrides[docType] === 'na') {
      delete currentOverrides[docType]
    } else {
      currentOverrides[docType] = 'na'
    }

    const { error } = await supabase
      .from('properties')
      .update({ compliance_overrides: currentOverrides })
      .eq('id', id)

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['properties', id] })
    }
  }

  const serveToAllTenants = async (documentId: string) => {
    if (!propertyTenants.length) return
    setServingDoc(documentId)
    try {
      const rows = propertyTenants.map((pt) => ({
        document_id: documentId,
        tenant_id: pt.tenant_id,
        tenancy_id: pt.tenancy_id,
        served_at: new Date().toISOString(),
      }))
      const { error } = await supabase
        .from('document_acknowledgements')
        .upsert(rows, { onConflict: 'document_id,tenant_id' })
      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['document-acknowledgements'] })
    } catch (err) {
      console.error('Error serving document:', err)
    } finally {
      setServingDoc(null)
    }
  }

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
            {property.address_line1}, {property.town}, {property.postcode}
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
                {(() => {
                  // Use the EPC document's file_path (direct cert URL) if available,
                  // then property.epc_certificate_url, then postcode search fallback
                  const epcDoc = propertyDocs.find((d) => d.document_type === 'epc')
                  const epcLink = (epcDoc?.file_path?.startsWith('http') ? epcDoc.file_path : null)
                    || property.epc_certificate_url
                    || (property.postcode ? `https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(property.postcode)}` : null)
                  return epcLink ? (
                    <a
                      href={epcLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Full EPC Certificate
                    </a>
                  ) : null
                })()}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No EPC data available.</p>
            )}
          </CardBody>
        </Card>

        {/* Document checklist — unified table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">Compliance</p>
                <h2 className="text-lg font-fraunces font-semibold text-slate-900">
                  Document checklist
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/documents/upload?property_id=${property.id}`}>
                  <Button size="sm">Upload Document</Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            {(() => {
              const docTypeLabels: Record<string, string> = {
                gas_safety: 'Gas Safety Certificate (CP12)', epc: 'EPC Certificate',
                eicr: 'EICR (Electrical Safety)', hmo_licence: 'HMO Licence',
                emergency_lighting: 'Emergency Lighting Report', fire_risk_assessment: 'Fire Risk Assessment',
                fire_emergency_procedures: 'Fire & Emergency Procedures', house_rules: 'House Rules / Guidance',
                how_to_rent: 'How to Rent Guide', renter_rights: "Renter's Rights",
                deposit_certificate: 'Deposit Protection Certificate', right_to_rent: 'Right to Rent Check',
                inventory: 'Inventory & Schedule of Condition', ast: 'Tenancy Agreement', other: 'Other Document',
              }

              const getDoc = (type: string) => propertyDocs.find((d) => d.document_type === type)
              const hasDocType = (type: string) => propertyDocs.some((d) => d.document_type === type)
              const getDocExpiry = (type: string) => getDoc(type)?.valid_to || null

              // Build required items list
              const requiredItems = [
                { docType: 'gas_safety', section: 'property', hasIt: !!property.gas_safety_expiry || hasDocType('gas_safety'), expiry: property.gas_safety_expiry || getDocExpiry('gas_safety') },
                { docType: 'epc', section: 'property', hasIt: !!property.epc_rating || hasDocType('epc'), expiry: property.epc_expiry || getDocExpiry('epc') },
                { docType: 'eicr', section: 'property', hasIt: !!property.eicr_expiry || hasDocType('eicr'), expiry: property.eicr_expiry || getDocExpiry('eicr') },
                ...(isHmo ? [
                  { docType: 'hmo_licence', section: 'hmo', hasIt: !!property.hmo_licence_number || hasDocType('hmo_licence'), expiry: property.hmo_licence_expiry || getDocExpiry('hmo_licence') },
                  { docType: 'emergency_lighting', section: 'hmo', hasIt: hasDocType('emergency_lighting'), expiry: getDocExpiry('emergency_lighting') },
                  { docType: 'fire_risk_assessment', section: 'hmo', hasIt: !!property.fire_risk_expiry || hasDocType('fire_risk_assessment'), expiry: property.fire_risk_expiry || getDocExpiry('fire_risk_assessment') },
                  { docType: 'fire_emergency_procedures', section: 'hmo', hasIt: hasDocType('fire_emergency_procedures'), expiry: getDocExpiry('fire_emergency_procedures') },
                  { docType: 'house_rules', section: 'hmo', hasIt: hasDocType('house_rules'), expiry: getDocExpiry('house_rules') },
                ] : []),
                { docType: 'how_to_rent', section: 'tenant', hasIt: hasDocType('how_to_rent'), expiry: getDocExpiry('how_to_rent') },
                { docType: 'renter_rights', section: 'tenant', hasIt: hasDocType('renter_rights'), expiry: getDocExpiry('renter_rights') },
                { docType: 'deposit_certificate', section: 'tenant', hasIt: hasDocType('deposit_certificate'), expiry: getDocExpiry('deposit_certificate') },
                { docType: 'right_to_rent', section: 'tenant', hasIt: rtrChecks.length > 0, expiry: rtrChecks[0]?.next_check_due || null },
                { docType: 'inventory', section: 'tenant', hasIt: hasDocType('inventory'), expiry: getDocExpiry('inventory') },
              ]

              // Also include any extra uploaded docs not in the required list (e.g. "other" type)
              const requiredDocTypes = new Set(requiredItems.map((r) => r.docType))
              const extraDocs = propertyDocs.filter((d) => !requiredDocTypes.has(d.document_type))

              let lastSection = ''

              return (
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
                    {requiredItems.map((item) => {
                      const doc = getDoc(item.docType)
                      const isNa = overrides[item.docType] === 'na'
                      const sectionLabel = item.section === 'property' ? 'Property Documents'
                        : item.section === 'hmo' ? 'HMO Compliance'
                        : 'Tenant Documents'
                      const showSectionHeader = sectionLabel !== lastSection
                      lastSection = sectionLabel

                      // Status
                      let statusLabel = 'Missing'
                      let statusColor = 'text-amber-600 bg-amber-50'
                      if (isNa) {
                        statusLabel = 'N/A'
                        statusColor = 'text-slate-400 bg-slate-100'
                      } else if (item.hasIt) {
                        if (doc?.tenant_confirmed_at) {
                          statusLabel = 'Accepted'
                          statusColor = 'text-success bg-successLight'
                        } else if (doc?.tenant_opened_at) {
                          statusLabel = 'Viewed'
                          statusColor = 'text-blue-700 bg-blue-50'
                        } else if (doc?.served_at) {
                          statusLabel = 'Served'
                          statusColor = 'text-teal-700 bg-teal-50'
                        } else {
                          statusLabel = 'Uploaded'
                          statusColor = 'text-textMuted bg-slate-100'
                        }
                      }

                      return (
                        <React.Fragment key={item.docType}>
                          {showSectionHeader && (
                            <tr>
                              <td colSpan={6} className="px-6 pt-5 pb-2 bg-white">
                                <p className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">{sectionLabel}</p>
                              </td>
                            </tr>
                          )}
                          <tr className={`hover:bg-slate-50/50 transition-colors ${isNa ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {isNa ? (
                                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
                                    <circle cx="11" cy="11" r="10" stroke="#94a3b8" strokeWidth="1.5" />
                                    <text x="11" y="12.5" textAnchor="middle" fontSize="7" fontWeight="600" fill="#94a3b8">N/A</text>
                                  </svg>
                                ) : item.hasIt ? <CheckCircle /> : <EmptyCircle />}
                                <div className="min-w-0">
                                  <p className="font-medium text-textPrimary truncate">
                                    {doc?.title || docTypeLabels[item.docType] || item.docType}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-textSecondary whitespace-nowrap">
                              {doc?.uploaded_at ? formatDateTime(doc.uploaded_at) : <span className="text-textMuted">—</span>}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {doc?.tenant_confirmed_at ? (
                                <span className="text-success font-medium">{formatDateTime(doc.tenant_confirmed_at)}</span>
                              ) : (
                                <span className="text-textMuted">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {(item.expiry || doc?.valid_to) ? (
                                <span className={new Date(item.expiry || doc?.valid_to || '') < new Date() ? 'text-error font-medium' : 'text-textSecondary'}>
                                  {formatDate(item.expiry || doc?.valid_to)}
                                  {new Date(item.expiry || doc?.valid_to || '') < new Date() && ' (expired)'}
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
                              <div className="flex items-center justify-end gap-2">
                                {item.hasIt && doc && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      setDownloadingId(doc.id)
                                      try {
                                        if (doc.file_path?.startsWith('http')) {
                                          window.open(doc.file_path, '_blank')
                                        } else if (doc.file_path) {
                                          const bucket = 'property-documents'
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
                                )}
                                {!item.hasIt && !isNa && item.docType === 'right_to_rent' && (
                                  <a
                                    href="https://www.gov.uk/landlords-immigration-check"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button size="sm">Run Check</Button>
                                  </a>
                                )}
                                {!item.hasIt && !isNa && item.docType !== 'right_to_rent' && (
                                  <Link to={`/documents/upload?property_id=${property.id}&document_type=${item.docType}`}>
                                    <Button size="sm">Upload</Button>
                                  </Link>
                                )}
                                {isNa ? (
                                  <button
                                    onClick={() => toggleOverride(item.docType)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    Undo
                                  </button>
                                ) : !item.hasIt && (
                                  <button
                                    onClick={() => toggleOverride(item.docType)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                    title="Mark as not applicable"
                                  >
                                    N/A
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                    {/* Extra uploaded docs not in the required list */}
                    {extraDocs.length > 0 && (
                      <>
                        <tr>
                          <td colSpan={6} className="px-6 pt-5 pb-2 bg-white">
                            <p className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">Other Documents</p>
                          </td>
                        </tr>
                        {extraDocs.map((doc: any) => {
                          let statusLabel = 'Uploaded'
                          let statusColor = 'text-textMuted bg-slate-100'
                          if (doc.tenant_confirmed_at) { statusLabel = 'Accepted'; statusColor = 'text-success bg-successLight' }
                          else if (doc.tenant_opened_at) { statusLabel = 'Viewed'; statusColor = 'text-blue-700 bg-blue-50' }
                          else if (doc.served_at) { statusLabel = 'Served'; statusColor = 'text-teal-700 bg-teal-50' }

                          return (
                            <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <CheckCircle />
                                  <div className="min-w-0">
                                    <p className="font-medium text-textPrimary truncate">
                                      {doc.title || docTypeLabels[doc.document_type] || doc.file_name || 'Untitled'}
                                    </p>
                                    <span className="text-xs text-textMuted">{docTypeLabels[doc.document_type] || doc.document_type}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-textSecondary whitespace-nowrap">{formatDateTime(doc.uploaded_at)}</td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {doc.tenant_confirmed_at ? <span className="text-success font-medium">{formatDateTime(doc.tenant_confirmed_at)}</span> : <span className="text-textMuted">—</span>}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {doc.valid_to ? (
                                  <span className={new Date(doc.valid_to) < new Date() ? 'text-error font-medium' : 'text-textSecondary'}>
                                    {formatDate(doc.valid_to)}{new Date(doc.valid_to) < new Date() && ' (expired)'}
                                  </span>
                                ) : <span className="text-textMuted">—</span>}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-pill ${statusColor}`}>{statusLabel}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button variant="ghost" size="sm" onClick={async () => {
                                  setDownloadingId(doc.id)
                                  try {
                                    if (doc.file_path?.startsWith('http')) { window.open(doc.file_path, '_blank') }
                                    else if (doc.file_path) {
                                      const bucket = 'property-documents'
                                      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(doc.file_path, 3600)
                                      if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank')
                                    }
                                  } finally { setDownloadingId(null) }
                                }} loading={downloadingId === doc.id}>
                                  {doc.file_path?.startsWith('http') ? 'View' : 'Download'}
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              )
            })()}
          </div>
        </Card>

        {/* HMO Rooms — only shown if property is HMO */}
        {isHmo && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">HMO</p>
                  <h2 className="text-lg font-fraunces font-semibold text-slate-900">
                    Rooms
                  </h2>
                </div>
                <Badge variant="secondary" size="sm">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              {roomsLoading ? (
                <div className="flex items-center justify-center h-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
                </div>
              ) : (
                <>
                  {rooms.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                              {room.room_label.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900">{room.room_label}</span>
                            {room.floor != null && (
                              <span className="text-xs text-slate-400">Floor {room.floor}</span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteRoom(room.id)}
                            disabled={deletingRoom === room.id}
                            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            {deletingRoom === room.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Room name or number (e.g. Room 1, The Attic, B2)"
                        value={newRoomLabel}
                        onChange={(e) => setNewRoomLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addRoom()
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addRoom}
                      loading={addingRoom}
                      disabled={!newRoomLabel.trim()}
                    >
                      Add Room
                    </Button>
                  </div>

                  {rooms.length === 0 && (
                    <p className="text-sm text-slate-400 mt-3">
                      Add rooms so you can assign tenants to specific rooms when creating tenancies.
                    </p>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        )}

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
