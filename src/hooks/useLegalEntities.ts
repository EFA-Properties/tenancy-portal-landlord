import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { LegalEntity } from '../types/database'
import { getCurrentUser } from '../lib/supabase'

export function useLegalEntities() {
  return useQuery({
    queryKey: ['legal_entities'],
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('legal_entities')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as LegalEntity[]
    },
  })
}

export function useLegalEntity(id: string) {
  return useQuery({
    queryKey: ['legal_entity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_entities')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as LegalEntity
    },
    enabled: !!id,
  })
}

export function useCreateLegalEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entity: Omit<LegalEntity, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('legal_entities')
        .insert([entity])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
    },
  })
}

export function useUpdateLegalEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...entity }: LegalEntity) => {
      const { data, error } = await supabase
        .from('legal_entities')
        .update(entity)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
    },
  })
}
