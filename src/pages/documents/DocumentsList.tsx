import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDocuments } from '../../hooks/useDocuments'
import { supabase } from '../../lib/supabase'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { formatDate } from '../../lib/utils'

const docTypeLabels: Record<string, string> = {
  ast: 'Tenancy Agreement',
  epc: 'EPC Certificate',
  gas_safety: 'Gas Safety (CP12)',
  eicr: 'EICR (Electrical)',
  inventory: 'Inventory',
  deposit_certificate: 'Deposit Certificate',
  how_to_rent: 'How to Rent',
  renter_rights: 'Renter Rights',
  other: 'Other',
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

  const scopeLabel = tenancyId ? 'Tenancy' : propertyId ? 'Property' : 'All'

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
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          {scopeLabel} Documents
        </h1>
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
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Scope</TableHeader>
                <TableHeader>Valid To</TableHeader>
                <TableHeader>Uploaded</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>{doc.title || doc.file_name || 'Untitled'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {docTypeLabels[doc.document_type] || doc.document_type || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.scope === 'property' ? (
                      <span className="text-sm">
                        {doc.properties ? `${doc.properties.address_line1}, ${doc.properties.town}` : 'Property'}
                      </span>
                    ) : (
                      <span className="text-sm">Tenancy</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(doc.valid_to)}</TableCell>
                  <TableCell>{formatDate(doc.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      loading={downloadingId === doc.id}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
