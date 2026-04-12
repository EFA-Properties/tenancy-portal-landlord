import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MaintenanceRequest } from '../types/database'

export function useMaintenanceRequests(tenancyId?: string) {
  return useQuery({
    queryKey: ['maintenance', tenancyId],
    queryFn: async () => {
      let query = supabase.from('maintenance_requests').select('*')
      if (tenancyId) {
        query = query.eq('tenancy_id', tenancyId)
      }
      const { data, error } = await query.order('reported_at', { ascending: false })
      if (error) throw error
      return data as MaintenanceRequest[]
    },
  })
}

export function useMaintenanceRequest(id: string) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          tenancy:tenancies(
            id,
            unit:units(id, name, property:properties(address_line1, town))
          ),
          tenant:tenants(id, full_name, email)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([request])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export function useUpdateMaintenanceRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...request }: MaintenanceRequest) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(request)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.setQueryData(['maintenance', data.id], data)
    },
  })
}
