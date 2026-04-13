import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDocuments } from '../../hooks/useDocuments'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { Download, FileText } from 'lucide-react'

export default function DocumentsList() {
  const [searchParams] = useSearchParams()
  const tenancyId = searchParams.get('tenancy_id')
  const { data: documents = [], isLoading } = useDocuments(tenancyId || undefined)

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
          Documents
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
                <TableHeader>Name</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Uploaded</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    <span className="font-medium">{doc.name}</span>
                  </TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download size={16} />
                        Download
                      </Button>
                    </a>
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
