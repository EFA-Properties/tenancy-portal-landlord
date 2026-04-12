import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { useUploadDocument } from '../../hooks/useDocuments'
import { getCurrentUser } from '../../lib/supabase'

const uploadDocumentSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  scope: z.enum(['property', 'tenancy']),
  title: z.string().min(1, 'Title is required'),
  validTo: z.string().optional(),
  file: z.instanceof(FileList).refine(
    (files) => files.length > 0,
    'File is required'
  ),
})

type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>

export function UploadDocument() {
  const navigate = useNavigate()
  const { mutate: uploadDocument, isPending } = useUploadDocument()
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadDocumentFormData>({
    resolver: zodResolver(uploadDocumentSchema),
  })

  const onSubmit = async (data: UploadDocumentFormData) => {
    try {
      setError('')
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const file = data.file[0]
      if (!file) throw new Error('File is required')

      uploadDocument({
        file,
        documentType: data.documentType,
        scope: data.scope,
        validTo: data.validTo,
        title: data.title,
        landlordId: user.id,
      } as any, {
        onSuccess: () => {
          navigate('/documents')
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to upload document')
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Documents
      </button>

      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Upload Document
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Title"
              placeholder="e.g., 32 Main Street - EPC"
              {...register('title')}
              error={errors.title?.message}
            />

            <Select
              label="Document Type"
              options={[
                { value: 'epc', label: 'EPC' },
                { value: 'cp12', label: 'Gas Safety (CP12)' },
                { value: 'eicr', label: 'EICR' },
                { value: 'hmo_licence', label: 'HMO Licence' },
                { value: 'fire_risk', label: 'Fire Risk Assessment' },
                { value: 'pat', label: 'PAT Testing' },
                { value: 'property_info', label: 'Property Info' },
                { value: 'ast', label: 'AST' },
                { value: 'deposit_cert', label: 'Deposit Certificate' },
                { value: 'how_to_rent', label: 'How to Rent' },
                { value: 'inventory', label: 'Inventory' },
                { value: 's13_notice', label: 'Section 13 Notice' },
                { value: 's8_notice', label: 'Section 8 Notice' },
                { value: 'other', label: 'Other' }
              ]}
              {...register('documentType')}
              error={errors.documentType?.message}
            />

            <Select
              label="Scope"
              options={[
                { value: 'property', label: 'Property Document' },
                { value: 'tenancy', label: 'Tenancy Document' }
              ]}
              {...register('scope')}
              error={errors.scope?.message}
            />

            <Input
              label="Valid Until (Optional)"
              type="date"
              {...register('validTo')}
            />

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Document File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-700 hover:bg-teal-50 transition-colors">
                <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600 mb-1">
                  Drag and drop your file or click to browse
                </p>
                <p className="text-xs text-slate-500">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                <input
                  type="file"
                  {...register('file')}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600">{errors.file.message as string}</p>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                isLoading={isPending}
              >
                Upload Document
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/documents')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
