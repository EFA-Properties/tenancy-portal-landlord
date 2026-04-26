import React from 'react'
import { Link } from 'react-router-dom'
import { useMessageInbox } from '../../hooks/useMessages'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate } from '../../lib/utils'

export default function MessagesList() {
  const { data: inbox = [], isLoading } = useMessageInbox()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
          Messages
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Communicate with your tenants
        </p>
      </div>

      {inbox.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No conversations yet"
              description="Messages with your tenants will appear here once you have active tenancies."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {inbox.map((conv: any) => (
              <Link
                key={conv.tenancyId}
                to={`/messages/${conv.tenancyId}`}
                className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-teal-700">
                    {conv.tenantName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                      {conv.tenantName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive" size="sm">{conv.unreadCount}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {conv.propertyAddress}
                  </p>
                  {conv.latestMessage && (
                    <p className="text-sm text-slate-500 mt-1 truncate">
                      {conv.latestSenderType === 'landlord' ? 'You: ' : ''}
                      {conv.latestMessage}
                    </p>
                  )}
                </div>

                {conv.latestMessageAt && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {formatDate(conv.latestMessageAt)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
