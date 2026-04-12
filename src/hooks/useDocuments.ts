import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Document } from '../types/database'

export function useDocuments(tenancyId: string | undefined) {
  return useQuery({
    queryKey: ['documents', tenancyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenancy_id', tenancyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Document[]
    },
    enabled: !!tenancyId,
  })
}

export function useDocument(documentId: string | undefined) {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error('No document ID')

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error
      return data as Document
    },
    enabled: !!documentId,
  })
}
