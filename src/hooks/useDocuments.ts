import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Document } from '../types/database'

export function useDocuments(propertyId?: string, tenancyId?: string) {
  return useQuery({
    queryKey: ['documents', propertyId, tenancyId],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }
      if (tenancyId) {
        query = query.eq('tenancy_id', tenancyId)
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false })
      if (error) throw error
      return data as Document[]
    },
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Document
    },
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      ...metadata
    }: {
      file: File
      propertyId?: string
      tenancyId?: string
      documentType: string
      scope: 'property' | 'tenancy'
      validTo?: string
      landlordId: string
      title: string
    }) => {
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`documents/${fileName}`, file)

      if (uploadError) throw uploadError

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            file_path: fileName,
            file_name: file.name,
            document_type: metadata.documentType,
            scope: metadata.scope,
            valid_to: metadata.validTo || null,
            landlord_id: metadata.landlordId,
            property_id: metadata.propertyId || null,
            tenancy_id: metadata.tenancyId || null,
            title: metadata.title,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data, error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
