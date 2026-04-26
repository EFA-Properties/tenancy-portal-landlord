import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTenancy } from '../../hooks/useTenancies'
import { useAgreements } from '../../hooks/useAgreements'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'

const statusVariant: Record<string, 'secondary' | 'warning' | 'success' | 'outline'> = {
  draft: 'secondary',
  sent: 'warning',
  viewed: 'outline',
  signed: 'success',
  countersigned: 'success',
}

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  sent: 'Awaiting Tenant',
  viewed: 'Viewed by Tenant',
  signed: 'Tenant Signed',
  countersigned: 'Fully Executed',
}

export default function AgreementsList() {
  const { tenancyId } = useParams<{ tenancyId: string }>()
  const navigate = useNavigate()
  const { data: tenancy } = useTenancy(tenancyId)
  const { data: agreements = [], isLoading } = useAgreements(tenancyId)

  const property = (tenancy as any)?.properties

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          { label: property ? `${property.address_line1}` : 'Tenancy', href: `/tenancies/${tenancyId}` },
          { label: 'Agreements' },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-fraunces font-semibold text-slate-900">
          Agreements & Inventories
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tenancies/${tenancyId}/agreements/new?type=inventory`)}
          >
            New Inventory
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/tenancies/${tenancyId}/agreements/new?type=tenancy_agreement`)}
          >
            New Agreement
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
        </div>
      ) : agreements.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-sm text-slate-500 mb-4">
              No agreements or inventories yet for this tenancy.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/tenancies/${tenancyId}/agreements/new?type=inventory`)}
              >
                Create Inventory
              </Button>
              <Button
                onClick={() => navigate(`/tenancies/${tenancyId}/agreements/new?type=tenancy_agreement`)}
              >
                Create Agreement
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {agreements.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{a.title}</h3>
                      <Badge size="sm" variant={statusVariant[a.status] || 'secondary'}>
                        {statusLabel[a.status] || a.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{a.type === 'inventory' ? 'Inventory' : 'Tenancy Agreement'}</span>
                      <span>Created {formatDate(a.created_at)}</span>
                      {a.landlord_signed_at && (
                        <span>Landlord signed {formatDate(a.landlord_signed_at)}</span>
                      )}
                      {a.tenant_signed_at && (
                        <span>Tenant signed {formatDate(a.tenant_signed_at)}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/tenancies/${tenancyId}/agreements/${a.id}`)}
                  >
                    View
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
