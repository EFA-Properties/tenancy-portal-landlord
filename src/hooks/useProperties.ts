import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Property[]
    },
  })
}

export function useProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['properties', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (error) throw error
      return data as Property
    },
    enabled: !!propertyId,
  })
}
