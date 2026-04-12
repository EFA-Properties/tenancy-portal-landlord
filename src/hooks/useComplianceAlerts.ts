import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { ComplianceAlert } from '../types/database'
import { getCurrentUser } from '../lib/supabase'

export function useComplianceAlerts() {
  return useQuery({
    queryKey: ['compliance_alerts'],
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('landlord_id', user.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ComplianceAlert[]
    },
  })
}

export function useComplianceAlert(id: string) {
  return useQuery({
    queryKey: ['compliance_alert', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_alerts')
        .select(`
          *,
          property:properties(id, address_line1, town)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateComplianceAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...alert }: ComplianceAlert) => {
      const { data, error } = await supabase
        .from('compliance_alerts')
        .update(alert)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance_alerts'] })
      queryClient.setQueryData(['compliance_alert', data.id], data)
    },
  })
}
