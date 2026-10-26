import React from 'react'
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

  // Property types this landlord owns, so we can flag the updates that affect them
  const ownedTypes = new Set<string>()
  properties.forEach((p) => {
    if (p.property_type) ownedTypes.add(p.property_type)
    if (p.is_hmo) ownedTypes.add('hmo')
  })
  const affectsYou = (appliesTo: string[]) =>
    properties.length > 0 && (appliesTo.includes('all') || appliesTo.some((t) => ownedTypes.has(t)))

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
          {updates.map((update) => (
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
                      <dt className="inline font-medium text-slate-700">Posted: </dt>
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
