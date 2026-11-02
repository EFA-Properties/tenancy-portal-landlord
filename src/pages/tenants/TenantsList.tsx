import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useTenancies } from '../../hooks/useTenancies'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate } from '../../lib/utils'

/**
 * One page for tenants and tenancies.
 * Each card is a tenancy (the agreement for a property or room) with the
 * people on it listed underneath. Invited tenants who are not linked to a
 * tenancy yet are shown in their own section so nobody gets lost.
 */

type Tab = 'current' | 'past'

interface Person {
  id: string
  full_name: string
  email: string
  phone: string | null
  invite_status: 'invited' | 'registered' | null
  link_status?: string | null
  moved_out_at?: string | null
  access_revoked_at?: string | null
}

function useUnlinkedTenants() {
  return useQuery({
    queryKey: ['tenants-unlinked'],
    queryFn: async () => {
      // RLS limits this to the signed in landlord's own tenants
      const { data, error } = await supabase
        .from('tenants')
        .select('id, full_name, email, phone, invite_status, tenancy_tenants(id)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).filter((t: any) => !t.tenancy_tenants || t.tenancy_tenants.length === 0) as Person[]
    },
  })
}

function PersonBadge({ person }: { person: Person }) {
  if (person.access_revoked_at) return <Badge variant="destructive" size="sm">Access revoked</Badge>
  if (person.link_status === 'moved_out') return <Badge variant="secondary" size="sm">Moved out</Badge>
  if (person.invite_status === 'invited') return <Badge variant="warning" size="sm">Invited</Badge>
  if (person.invite_status === 'registered') return <Badge variant="success" size="sm">Signed up</Badge>
  return <Badge variant="default" size="sm">Active</Badge>
}

function PersonRow({ person }: { person: Person }) {
  return (
    <Link
      to={`/tenants/${person.id}`}
      className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-surface transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-textPrimary truncate">{person.full_name}</p>
        <p className="text-xs text-textMuted truncate">
          {person.email}
          {person.phone ? ` · ${person.phone}` : ''}
          {person.link_status === 'moved_out' && person.moved_out_at ? ` · Moved out ${formatDate(person.moved_out_at)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PersonBadge person={person} />
        <span className="text-xs text-teal-700 font-medium">View tenant ›</span>
      </div>
    </Link>
  )
}

export default function TenantsList() {
  const { data: tenancies = [], isLoading } = useTenancies()
  const { data: unlinked = [] } = useUnlinkedTenants()
  const [tab, setTab] = useState<Tab>('current')

  const withPeople = tenancies.map((t: any) => {
    const people: Person[] = (t.tenancy_tenants || [])
      .filter((l: any) => l.tenants)
      .map((l: any) => ({
        ...l.tenants,
        link_status: l.status,
        moved_out_at: l.moved_out_at,
        access_revoked_at: l.access_revoked_at,
      }))
    const allMovedOut = people.length > 0 && people.every((p) => p.link_status === 'moved_out')
    const isPast = t.status === 'ended' || allMovedOut
    return { tenancy: t, people, isPast }
  })

  const current = withPeople.filter((x) => !x.isPast)
  const past = withPeople.filter((x) => x.isPast)
  const shown = tab === 'current' ? current : past

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active ? 'border-teal-700 text-teal-700' : 'border-transparent text-textMuted hover:text-textSecondary'
    }`

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">Tenants</h1>
          <p className="text-textMuted text-small mt-1">
            Your tenants and the tenancy each one is on.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/tenants/invite">
            <Button variant="outline">Invite tenant</Button>
          </Link>
          <Link to="/tenancies/new">
            <Button>Add tenancy</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button onClick={() => setTab('current')} className={tabClass(tab === 'current')}>
          Current
          {current.length > 0 && (
            <span className="ml-2 text-xs bg-surface text-textMuted px-1.5 py-0.5 rounded-full">{current.length}</span>
          )}
        </button>
        <button onClick={() => setTab('past')} className={tabClass(tab === 'past')}>
          Past
          {past.length > 0 && (
            <span className="ml-2 text-xs bg-surface text-textMuted px-1.5 py-0.5 rounded-full">{past.length}</span>
          )}
        </button>
      </div>

      {tab === 'current' && unlinked.length > 0 && (
        <Card className="mb-4 border-amber-200">
          <div className="px-6 pt-5 pb-3">
            <p className="text-body font-medium text-textPrimary">Not on a tenancy yet</p>
            <p className="text-small text-textMuted mt-0.5">
              Add a tenancy for these tenants so they receive their documents.
            </p>
          </div>
          <div className="divide-y divide-border border-t border-border">
            {unlinked.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </div>
        </Card>
      )}

      {shown.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title={tab === 'current' ? 'No current tenancies' : 'No past tenancies'}
              description={
                tab === 'current'
                  ? 'Invite a tenant, then add a tenancy to link them to a property.'
                  : 'Tenancies that have ended will appear here for your records.'
              }
              action={
                tab === 'current'
                  ? { label: 'Add tenancy', onClick: () => (window.location.href = '/tenancies/new') }
                  : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {shown.map(({ tenancy, people }) => {
            const property = tenancy.properties
            const address = property
              ? `${property.address_line1}${property.town ? `, ${property.town}` : ''}`
              : 'Unknown property'
            return (
              <Card key={tenancy.id}>
                <Link
                  to={`/tenancies/${tenancy.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-surface transition-colors rounded-t-xl"
                >
                  <div className="min-w-0">
                    <p className="text-body font-medium text-textPrimary">{address}</p>
                    <p className="text-small text-textMuted mt-0.5">
                      £{Number(tenancy.monthly_rent).toFixed(2)}/month · Started {formatDate(tenancy.start_date)}
                      {tenancy.end_date ? ` · Ends ${formatDate(tenancy.end_date)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      size="sm"
                      variant={tenancy.status === 'active' ? 'success' : tenancy.status === 'pending' ? 'warning' : 'secondary'}
                    >
                      {tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-teal-700 font-medium">Open tenancy ›</span>
                  </div>
                </Link>
                <div className="divide-y divide-border border-t border-border">
                  {people.length === 0 ? (
                    <p className="px-6 py-3 text-sm text-textMuted">No tenant linked yet. Open the tenancy to add one.</p>
                  ) : (
                    people.map((p) => <PersonRow key={p.id} person={p} />)
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
