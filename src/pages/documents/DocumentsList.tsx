import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDocuments } from '../../hooks/useDocuments'
import { supabase } from '../../lib/supabase'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate } from '../../lib/utils'

const docTypeLabels: Record<string, string> = {
  ast: 'Tenancy Agreement',
  epc: 'EPC Certificate',
  gas_safety: 'Gas Safety Certificate (CP12)',
  eicr: 'EICR (Electrical Safety)',
  inventory: 'Inventory',
  deposit_certificate: 'Deposit Protection Certificate',
  how_to_rent: 'How to Rent Guide',
  renter_rights: "Renter's Rights",
  other: 'Other Document',
}

const docTypeDescriptions: Record<string, string> = {
  ast: 'Assured Shorthold Tenancy agreement',
  epc: 'Minimum C rating required from 2028',
  gas_safety: 'Annual renewal · Tenant must receive each year',
  eicr: 'Every 5 years · Required before letting',
  inventory: 'Property condition at check-in',
  deposit_certificate: 'DPS / TDS / MyDeposits · Within 30 days',
  how_to_rent: 'Gov.uk · Must be current edition',
  renter_rights: 'Renters Reform Bill documentation',
  other: 'Additional documentation',
}

function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <circle cx="11" cy="11" r="11" fill="#0f766e" />
      <path d="M7 11l2.5 2.5L15 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
      <rect x="4" y="2" width="14" height="18" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M8 8h6M8 12h4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function DocumentsList() {
  const [searchParams] = useSearchParams()
  const tenancyId = searchParams.get('tenancy_id') || undefined
  const propertyId = searchParams.get('property_id') || undefined
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const { data: documents = [], isLoading } = useDocuments({
    tenancy_id: tenancyId,
    property_id: propertyId,
  })

  const handleDownload = async (doc: any) => {
    setDownloadingId(doc.id)
    try {
      const bucket = doc.scope === 'property' ? 'property-documents' : 'tenancy-documents'
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(doc.file_path, 3600)

      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900">
            Documents
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} uploaded
          </p>
        </div>
        <Link to="/documents/upload">
          <Button>Upload Document</Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No documents yet"
              description="Upload your first document to get started."
              action={{ label: 'Upload Document', onClick: () => window.location.href = '/documents/upload' }}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-8 py-5 hover:bg-slate-50/50 transition-colors"
              >
                <CheckCircle />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-textPrimary">
                    {doc.title || docTypeLabels[doc.document_type] || doc.file_name || 'Untitled'}
                  </p>
                  <p className="text-small text-textMuted mt-0.5">
                    {doc.scope === 'property' && doc.properties
                      ? `${doc.properties.address_line1}, ${doc.properties.town}`
                      : docTypeDescriptions[doc.document_type] || ''}
                    {doc.valid_to ? ` · Valid to ${formatDate(doc.valid_to)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" size="sm">
                    {docTypeLabels[doc.document_type] || doc.document_type || 'Other'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    loading={downloadingId === doc.id}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
