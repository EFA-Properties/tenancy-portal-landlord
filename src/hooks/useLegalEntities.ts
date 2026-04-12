import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { LegalEntity } from '../types/database'

export function useLegalEntities() {
  return useQuery({
    queryKey: ['legal_entities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { data, error } = await supabase
        .from('legal_entities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as LegalEntity[]
    },
  })
}

export function useLegalEntity(entityId: string | undefined) {
  return useQuery({
    queryKey: ['legal_entities', entityId],
    queryFn: async () => {
      if (!entityId) throw new Error('No entity ID')

      const { data, error } = await supabase
        .from('legal_entities')
        .select('*')
        .eq('id', entityId)
        .single()

      if (error) throw error
      return data as LegalEntity
    },
    enabled: !!entityId,
  })
}
