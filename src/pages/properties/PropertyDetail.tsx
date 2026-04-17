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
import { formatDate, epcRatingColor } from '../../lib/utils'

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
                { title: 'Right to Rent Check', desc: 'Required before every tenancy · £20,000 fine per tenant', docType: 'right_to_rent', hasIt: rtrChecks.length > 0, expiry: rtrChecks[0]?.next_check_due || null },
                { title: 'Inventory & Schedule of Condition', desc: 'Check-in report · Signed by tenant · Protects deposit claims', docType: 'inventory', hasIt: hasDocType('inventory'), expiry: getDocExpiry('inventory') },
              ]

              const items = [...propertyItems, ...tenantItems]

              const getDocAcks = (docId: string) => acknowledgements.filter((a) => a.document_id === docId)
              const totalTenants = propertyTenants.length

              const renderSection = (sectionItems: typeof items, label: string, isTenantSection: boolean) => (
                <>
                  <div className="px-8 pt-5 pb-2">
                    <p className="text-[10px] font-mono font-medium text-textMuted uppercase tracking-widest">{label}</p>
                  </div>
                  {sectionItems.map((item) => {
                const doc = getDoc(item.docType)
                const acks = doc ? getDocAcks(doc.id) : []
                const servedCount = acks.filter((a) => a.served_at).length
                const openedCount = acks.filter((a) => a.opened_at).length
                const confirmedCount = acks.filter((a) => a.confirmed_at).length
                const allServed = totalTenants > 0 && servedCount >= totalTenants
                const allConfirmed = totalTenants > 0 && confirmedCount >= totalTenants
                const isNa = overrides[item.docType] === 'na'
                return (
                  <div key={item.title} className={`flex items-center gap-5 px-8 py-6 ${isNa ? 'opacity-50' : ''}`}>
                    {isNa ? (
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                        <circle cx="14" cy="14" r="13" stroke="#94a3b8" strokeWidth="1.5" />
                        <text x="14" y="15.5" textAnchor="middle" fontSize="8" fontWeight="600" fill="#94a3b8">N/A</text>
                      </svg>
                    ) : item.hasIt ? <CheckCircle /> : <EmptyCircle />}
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-textPrimary">{item.title}</p>
                      <p className="text-sm text-textMuted mt-1">{item.desc}</p>
                      {/* Per-tenant acknowledgement tracking */}
                      {doc && item.hasIt && isTenantSection && totalTenants > 0 && (
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {servedCount > 0 ? (
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-pill ${allServed ? 'text-teal-700 bg-teal-50' : 'text-warning bg-warningLight'}`}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill={allServed ? '#0f766e' : '#b45309'} /><path d="M3 5l1.5 1.5L7 4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              Served {servedCount}/{totalTenants}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-textMuted bg-surface px-2 py-0.5 rounded-pill">
                              Not served
                            </span>
                          )}
                          {servedCount > 0 && (
                            <>
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-pill ${openedCount === totalTenants ? 'text-teal-700 bg-teal-50' : openedCount > 0 ? 'text-warning bg-warningLight' : 'text-textMuted bg-surface'}`}>
                                Opened {openedCount}/{totalTenants}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-pill ${allConfirmed ? 'text-success bg-successLight' : confirmedCount > 0 ? 'text-warning bg-warningLight' : 'text-textMuted bg-surface'}`}>
                                {allConfirmed ? (
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#15803d" /><path d="M3 5l1.5 1.5L7 4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : null}
                                Confirmed {confirmedCount}/{totalTenants}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {/* Single-tenant fallback for property docs or when no tenants */}
                      {doc && item.hasIt && !isTenantSection && doc.served_at && (
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-pill">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#0f766e" /><path d="M3 5l1.5 1.5L7 4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Served {formatDate(doc.served_at)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {isNa ? (
                        <button
                          onClick={() => toggleOverride(item.docType)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Undo N/A
                        </button>
                      ) : (
                        <>
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
                      {/* Serve to all tenants button for tenant docs */}
                      {doc && item.hasIt && isTenantSection && totalTenants > 0 && !allServed && (
                        <button
                          onClick={() => serveToAllTenants(doc.id)}
                          disabled={servingDoc === doc.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
                        >
                          {servingDoc === doc.id ? 'Serving…' : 'Serve to all'}
                        </button>
                      )}
                      {!item.hasIt && item.docType === 'right_to_rent' && (
                        <a
                          href="https://www.gov.uk/landlords-immigration-check"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Run Check
                        </a>
                      )}
                      {!item.hasIt && item.docType !== 'right_to_rent' && (
                        <Link to={`/documents/upload?property_id=${property.id}&document_type=${item.docType}`}>
                          <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-600 transition-colors shadow-sm">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M7 1v12M1 7h12" />
                            </svg>
                            Upload
                          </button>
                        </Link>
                      )}
                      {/* Mark N/A — available for items that aren't uploaded yet */}
                      {!item.hasIt && (
                        <button
                          onClick={() => toggleOverride(item.docType)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Mark as not applicable for this property"
                        >
                          N/A
                        </button>
                      )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
                </>
              )

              return (
                <>
                  {renderSection(propertyItems, 'Property documents', false)}
                  {renderSection(tenantItems, 'Tenant documents', true)}
                </>
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
