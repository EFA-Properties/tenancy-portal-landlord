import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tenancy } from '../types/database'

export function useTenancies() {
  return useQuery({
    queryKey: ['tenancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancies')
        .select('*, properties(*), tenants(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Tenancy & { properties: any; tenants: any })[]
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
        .select('*, properties(*), tenants(*)')
        .eq('id', tenancyId)
        .single()

      if (error) throw error
      return data as Tenancy & { properties: any; tenants: any }
    },
    enabled: !!tenancyId,
  })
}

export function useLinkTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tenancyId, tenantId }: { tenancyId: string; tenantId: string }) => {
      const { error } = await supabase
        .from('tenancies')
        .update({ tenant_id: tenantId })
        .eq('id', tenancyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancies'] })
    },
  })
}
