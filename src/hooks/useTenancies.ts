import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tenancy } from '../types/database'

export function useTenancies() {
  return useQuery({
    queryKey: ['tenancies'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { data, error } = await supabase
        .from('tenancies')
        .select('*, properties(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Tenancy & { properties: any })[]
    },
  })
}

export function useTenancy(tenancyId: string | undefined) {
  return useQuery({
    queryKey: ['tenancies', tenancyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')

      const { data, error } = await supabase
        .from('tenancies')
        .select('*, properties(*)')
        .eq('id', tenancyId)
        .single()

      if (error) throw error
      return data as Tenancy & { properties: any }
    },
    enabled: !!tenancyId,
  })
}
