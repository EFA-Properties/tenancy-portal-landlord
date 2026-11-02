import React, { useState } from 'react'
import { format } from 'date-fns'
import { useLandlordUpdates } from '../../hooks/useLandlordUpdates'
import { useProperties } from '../../hooks/useProperties'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Bell, ExternalLink } from 'lucide-react'

const propertyTypeLabels: Record<string, string> = {
  all: 'All lets',
  btl: 'Buy to Let',
  hmo: 'HMO',
  holiday_let: 'Holiday Let',
  commercial: 'Commercial',
}

type SortKey = 'action' | 'newest' | 'oldest' | 'soonest'
type FilterKey = 'all' | 'action' | 'heads_up' | 'mine'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'action', label: 'Time to act first' },
  { key: 'newest', label: 'Newest announced' },
  { key: 'oldest', label: 'Oldest announced' },
  { key: 'soonest', label: 'Coming in soonest' },
]

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Time to act' },
  { key: 'heads_up', label: 'Heads up' },
  { key: 'mine', label: 'Affects my properties' },
]

const time = (d: string | null | undefined) => (d ? new Date(d).getTime() : NaN)

function sourceLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return `View on ${host} (external site)`
  } catch {
    return 'View the source (external site)'
  }
}

export default function WhatsChanging() {
  const { data: updates = [], isLoading } = useLandlordUpdates()
  const { data: properties = [] } = useProperties()
  const [sortBy, setSortBy] = useState<SortKey>('action')
  const [filter, setFilter] = useState<FilterKey>('all')

  // Property types this landlord owns, so we can flag the updates that affect them
  const ownedTypes = new Set<string>()
  properties.forEach((p) => {
    if (p.property_type) ownedTypes.add(p.property_type)
    if (p.is_hmo) ownedTypes.add('hmo')
  })
  const affectsYou = (appliesTo: string[]) =>
    properties.length > 0 && (appliesTo.includes('all') || appliesTo.some((t) => ownedTypes.has(t)))

  const filtered = updates.filter((u) => {
    if (filter === 'action') return u.status === 'action_needed'
    if (filter === 'heads_up') return u.status !== 'action_needed'
    if (filter === 'mine') return affectsYou(u.applies_to)
    return true
  })

  const byNewest = (a: typeof updates[number], b: typeof updates[number]) =>
    time(b.published_at) - time(a.published_at)

  const shown = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return byNewest(a, b)
    if (sortBy === 'oldest') return -byNewest(a, b)
    if (sortBy === 'soonest') {
      // Changes still to come first, nearest date at the top; past or undated ones after, newest first
      const now = Date.now()
      const ta = time(a.takes_effect)
      const tb = time(b.takes_effect)
      const aUpcoming = ta >= now
      const bUpcoming = tb >= now
      if (aUpcoming && bUpcoming) return ta - tb
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
      return byNewest(a, b)
    }
    // Time to act first, then newest announced
    const diff = Number(b.status === 'action_needed') - Number(a.status === 'action_needed')
    return diff !== 0 ? diff : byNewest(a, b)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-2">
        What's Changing
      </h1>
      <p className="text-slate-600 mb-6 max-w-3xl">
        Friendly heads ups about upcoming changes for landlords in England, so nothing catches you by surprise.
        We'll let you know here and by email when something needs doing.
      </p>

      <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 max-w-3xl">
        These updates are written by Tenancy Portal, a service of P3 Technologies Ltd (Company No. 17180916).
        This is not a government website. Our summaries are general information, not legal advice, so please
        check the official source linked on each update.
      </div>

      {updates.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Nothing new right now"
              description="When a change for landlords is announced, we'll add a plain English summary here."
              icon={<Bell size={32} />}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
              {filterOptions.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    filter === f.key
                      ? 'bg-teal-700 border-teal-700 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-teal-700 hover:text-teal-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort by
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-teal-700 focus:outline-none"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {shown.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-sm text-slate-600">Nothing matches this filter right now.</p>
              </CardBody>
            </Card>
          )}

          {shown.map((update) => (
            <Card key={update.id}>
              <CardBody>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {update.status === 'action_needed' ? (
                    <Badge variant="warning">Time to act</Badge>
                  ) : (
                    <Badge variant="default">Heads up, no action yet</Badge>
                  )}
                  {affectsYou(update.applies_to) && <Badge variant="success">Affects your properties</Badge>}
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{update.title}</h2>
                <p className="text-slate-700 whitespace-pre-line mb-4">{update.summary}</p>
                <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
                  <div>
                    <dt className="inline font-medium text-slate-700">Applies to: </dt>
                    <dd className="inline">
                      {update.applies_to.map((t) => propertyTypeLabels[t] ?? t).join(', ')}
                    </dd>
                  </div>
                  {update.takes_effect && (
                    <div>
                      <dt className="inline font-medium text-slate-700">Expected from: </dt>
                      <dd className="inline">{format(new Date(update.takes_effect), 'd MMMM yyyy')}</dd>
                    </div>
                  )}
                  {update.published_at && (
                    <div>
                      <dt className="inline font-medium text-slate-700">Announced: </dt>
                      <dd className="inline">{format(new Date(update.published_at), 'd MMMM yyyy')}</dd>
                    </div>
                  )}
                </dl>
                {update.source_url && (
                  <a
                    href={update.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    {sourceLabel(update.source_url)}
                    <ExternalLink size={14} />
                  </a>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
