import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Upload } from 'lucide-react'
import { FeatureGate } from '../../components/FeatureGate'

export default function UploadDocument() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const prefilledPropertyId = searchParams.get('property_id') || ''
  const prefilledTenancyId = searchParams.get('tenancy_id') || ''
  const prefilledDocType = searchParams.get('document_type') || ''

  const [formData, setFormData] = useState({
    scope: prefilledTenancyId ? 'tenancy' : 'property',
    property_id: prefilledPropertyId,
    tenancy_id: prefilledTenancyId,
    document_type: prefilledDocType,
    title: '',
    description: '',
    valid_from: '',
    valid_to: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Array<{ id: string; address_line1: string; town: string }>>([])
  const [tenancies, setTenancies] = useState<Array<{ id: string; property_id: string; properties: any; tenants: any }>>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const { data: landlord } = await supabase
          .from('landlords')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!landlord) {
          setError('Landlord record not found')
          setLoadingData(false)
          return
        }

        const [{ data: propsData }, { data: tenanciesData }] = await Promise.all([
          supabase
            .from('properties')
            .select('id, address_line1, town')
            .eq('landlord_id', landlord.id),
          supabase
            .from('tenancies')
            .select('id, property_id, properties(address_line1, town), tenants(full_name)')
            .eq('landlord_id', landlord.id),
        ])

        setProperties(propsData || [])
        setTenancies(tenanciesData || [])
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load properties and tenancies')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) {
      setError('File and authentication required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: landlord } = await supabase
        .from('landlords')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!landlord) throw new Error('Landlord not found')

      // Upload file to storage (use correct bucket based on scope)
      // Storage RLS policies expect the first folder to be the property_id or tenancy_id
      const bucket = formData.scope === 'property' ? 'property-documents' : 'tenancy-documents'
      const folderId = formData.scope === 'property' ? formData.property_id : formData.tenancy_id
      const fileName = `${Date.now()}-${file.name}`
      const storagePath = `${folderId}/${fileName}`

      console.log('Upload attempt:', { bucket, storagePath, folderId, landlordId: landlord.id })

      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file)

      if (storageError) {
        console.error('Storage upload error:', storageError)
        throw new Error(`Storage upload failed: ${storageError.message}`)
      }

      console.log('Storage upload success:', storageData)

      // Create document record
      const docPayload = {
        landlord_id: landlord.id,
        scope: formData.scope,
        property_id: formData.scope === 'property' ? formData.property_id : null,
        tenancy_id: formData.scope === 'tenancy' ? formData.tenancy_id : null,
        document_type: formData.document_type,
        title: formData.title,
        description: formData.description || null,
        file_path: storageData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        valid_from: formData.valid_from || null,
        valid_to: formData.valid_to || null,
        uploaded_by: landlord.id,
      }

      console.log('Document insert payload:', docPayload)

      const { error: docError } = await supabase.from('documents').insert(docPayload)

      if (docError) {
        console.error('Document insert error:', docError)
        throw new Error(`Document record failed: ${docError.message}`)
      }

      // Invalidate cached queries so lists update immediately
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      await queryClient.invalidateQueries({ queryKey: ['property-documents'] })
      await queryClient.invalidateQueries({ queryKey: ['tenancy-documents'] })

      navigate('/documents')
    } catch (err) {
      console.error('Error uploading document:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const docTypes = [
    { value: 'ast', label: 'Assured Shorthold Tenancy' },
    { value: 'epc', label: 'Energy Performance Certificate' },
    { value: 'gas_safety', label: 'Gas Safety Certificate' },
    { value: 'eicr', label: 'EICR (Electrical)' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'deposit_certificate', label: 'Deposit Certificate' },
    { value: 'how_to_rent', label: 'How to Rent Guide' },
    { value: 'renter_rights', label: "Renter's Rights" },
    { value: 'other', label: 'Other' },
  ]

  const scopeOptions = [
    { value: 'property', label: 'Property' },
    { value: 'tenancy', label: 'Tenancy' },
  ]

  if (loadingData) {
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
        <p>Loading...</p>
      </div>
    )
  }

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

      <FeatureGate feature="Document upload" description="Upload and deliver compliance documents to your tenants through the portal.">
      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Document Details
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-600 rounded-lg text-red-600">
                {error}
              </div>
            )}

            <Select
              label="Document Scope"
              name="scope"
              value={formData.scope}
              onChange={handleChange}
              options={scopeOptions}
              required
            />

            {formData.scope === 'property' && (
              <Select
                label="Property"
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                options={properties.map((p) => ({
                  value: p.id,
                  label: `${p.address_line1}, ${p.town}`,
                }))}
                required
              />
            )}

            {formData.scope === 'tenancy' && (
              <Select
                label="Tenancy"
                name="tenancy_id"
                value={formData.tenancy_id}
                onChange={handleChange}
                options={tenancies.map((t) => ({
                  value: t.id,
                  label: `${(t as any).properties?.address_line1 || 'Unknown'}, ${(t as any).properties?.town || ''}${(t as any).tenants ? ` — ${(t as any).tenants.full_name}` : ''}`,
                }))}
                required
              />
            )}

            <Select
              label="Document Type"
              name="document_type"
              value={formData.document_type}
              onChange={handleChange}
              options={docTypes}
              required
            />

            <Input
              label="Document Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Tenancy Agreement 2024"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add any additional details..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valid From (optional)"
                name="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={handleChange}
              />
              <Input
                label="Valid To (optional)"
                name="valid_to"
                type="date"
                value={formData.valid_to}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center relative overflow-hidden">
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
                      PDF, DOC, DOCX, JPG, PNG up to 10 MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
      </FeatureGate>
    </div>
  )
}
