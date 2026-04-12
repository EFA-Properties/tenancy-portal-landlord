import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tenant } from '../types/database'

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Tenant[]
    },
  })
}

export function useTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID')

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (error) throw error
      return data as Tenant
    },
    enabled: !!tenantId,
  })
}
