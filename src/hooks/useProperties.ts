import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Property } from '../types/database'

export function useProperties(legalEntityId?: string) {
  return useQuery({
    queryKey: ['properties', legalEntityId],
    queryFn: async () => {
      let query = supabase.from('properties').select('*')
      if (legalEntityId) {
        query = query.eq('legal_entity_id', legalEntityId)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Property[]
    },
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Property
    },
    enabled: !!id,
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert([property])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.setQueryData(['property', data.id], data)
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...property }: Property) => {
      const { data, error } = await supabase
        .from('properties')
        .update(property)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.setQueryData(['property', data.id], data)
    },
  })
}
