import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Upload } from 'lucide-react'

export default function UploadDocument() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tenancy_id: '',
    name: '',
    type: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setTimeout(() => {
      navigate('/documents')
    }, 1000)
  }

  const docTypes = [
    { value: 'ast', label: 'Assured Shorthold Tenancy' },
    { value: 'deposit', label: 'Deposit Certificate' },
    { value: 'epc', label: 'Energy Performance Certificate' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Documents', href: '/documents' },
          { label: 'Upload Document' },
        ]}
      />

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Upload Document
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Document Details
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Tenancy ID"
              name="tenancy_id"
              value={formData.tenancy_id}
              onChange={handleChange}
              placeholder="Enter tenancy ID"
              required
            />
            <Input
              label="Document Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Tenancy Agreement"
              required
            />
            <Select
              label="Document Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={docTypes}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                {file ? (
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="font-medium text-slate-900">
                      Drag and drop or click to select
                    </p>
                    <p className="text-sm text-slate-600">
                      PDF, DOC, DOCX up to 10 MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" loading={loading} disabled={!file}>
                Upload Document
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/documents')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
