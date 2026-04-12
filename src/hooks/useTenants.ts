import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Tenant } from '../types/database'

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Tenant[]
    },
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          tenancy_tenants:tenancy_tenants(
            id,
            is_lead_tenant,
            tenancy:tenancies(
              id,
              start_date,
              end_date,
              status,
              unit:units(id, name)
            )
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useSearchTenants(query: string) {
  return useQuery({
    queryKey: ['tenants', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)
      if (error) throw error
      return data as Tenant[]
    },
    enabled: query.length > 0,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenant: Omit<Tenant, 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert([tenant])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...tenant }: Tenant) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(tenant)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.setQueryData(['tenant', data.id], data)
    },
  })
}
