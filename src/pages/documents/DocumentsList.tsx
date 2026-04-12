import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDocuments } from '../../hooks/useDocuments'
import { FileText } from 'lucide-react'
import { formatDate, isAfter, subDays } from 'date-fns'

export function DocumentsList() {
  const { data: documents, isLoading } = useDocuments()
  const navigate = useNavigate()

  const today = new Date()
  const thirtyDaysFromNow = subDays(today, -30)

  const getExpiryStatus = (validTo: string | null) => {
    if (!validTo) return null
    const expiry = new Date(validTo)
    if (isAfter(today, expiry)) return 'expired'
    if (isAfter(thirtyDaysFromNow, expiry)) return 'expiring'
    return 'valid'
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents' }
      ]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Documents
        </h1>
        <Button onClick={() => navigate('/documents/upload')}>
          <Plus size={20} className="mr-2" />
          Upload Document
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-slate-500">Loading documents...</div>
        </div>
      ) : !documents || documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Documents"
          description="Upload your first document to get started."
          action={{ label: 'Upload Document', onClick: () => navigate('/documents/upload') }}
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const expiryStatus = getExpiryStatus(doc.valid_to)
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">
                      {doc.title || doc.file_name}
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge variant="default">
                        {doc.document_type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {doc.scope === 'property' ? 'Property Document' : 'Tenancy Document'}
                      </span>
                    </div>
                  </div>

                  {doc.valid_to && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        Expires {formatDate(new Date(doc.valid_to), 'MMM d, yyyy')}
                      </p>
                      <Badge variant={expiryStatus === 'expired' ? 'danger' : expiryStatus === 'expiring' ? 'warning' : 'success'}>
                        {expiryStatus === 'expired' ? 'Expired' : expiryStatus === 'expiring' ? 'Expiring Soon' : 'Valid'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
