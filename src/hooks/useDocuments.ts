import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useDocuments(filters?: { tenancy_id?: string; property_id?: string; scope?: string }) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*, properties(address_line1, town)')
        .order('uploaded_at', { ascending: false })

      if (filters?.tenancy_id) {
        query = query.eq('tenancy_id', filters.tenancy_id)
      }
      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id)
      }
      if (filters?.scope) {
        query = query.eq('scope', filters.scope)
      }

      const { data, error } = await query
      if (error) throw error
      return data as any[]
    },
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
      return data as any
    },
    enabled: !!documentId,
  })
}
