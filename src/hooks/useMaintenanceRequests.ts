import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MaintenanceRequest } from '../types/database'

export function useMaintenanceRequests(tenancyId: string | undefined) {
  return useQuery({
    queryKey: ['maintenance_requests', tenancyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenancy_id', tenancyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MaintenanceRequest[]
    },
    enabled: !!tenancyId,
  })
}

export function useMaintenanceRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ['maintenance_requests', requestId],
    queryFn: async () => {
      if (!requestId) throw new Error('No request ID')

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (error) throw error
      return data as MaintenanceRequest
    },
    enabled: !!requestId,
  })
}
