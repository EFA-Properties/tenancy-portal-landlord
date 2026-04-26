import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tenancy } from '../types/database'

export function useTenancies() {
  return useQuery({
    queryKey: ['tenancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancies')
        .select('*, properties(*), tenancy_tenants(*, tenants(*))')
        .order('created_at', { ascending: false })

      if (error) throw error
      // Flatten: extract first tenant from junction table for backwards compatibility
      return (data || []).map((t: any) => ({
        ...t,
        tenants: t.tenancy_tenants?.[0]?.tenants || null,
      })) as (Tenancy & { properties: any; tenants: any })[]
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
        .select('*, properties(*), tenancy_tenants(*, tenants(*))')
        .eq('id', tenancyId)
        .single()

      if (error) throw error
      // Flatten: extract first tenant from junction for backwards compatibility
      return {
        ...data,
        tenants: data.tenancy_tenants?.[0]?.tenants || null,
      } as Tenancy & { properties: any; tenants: any }
    },
    enabled: !!tenancyId,
  })
}

export function useLinkTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tenancyId, tenantId }: { tenancyId: string; tenantId: string }) => {
      // Link tenant via the tenancy_tenants junction table
      const { error } = await supabase
        .from('tenancy_tenants')
        .upsert(
          { tenancy_id: tenancyId, tenant_id: tenantId, status: 'active' },
          { onConflict: 'tenancy_id,tenant_id' }
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancies'] })
    },
  })
}
