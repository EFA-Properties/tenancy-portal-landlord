import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ComplianceAlert } from '../types/database'

export function useComplianceAlerts(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['compliance_alerts', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')

      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('property_id', propertyId)
        .order('due_date', { ascending: true })

      if (error) throw error
      return data as ComplianceAlert[]
    },
    enabled: !!propertyId,
  })
}

export function useComplianceAlert(alertId: string | undefined) {
  return useQuery({
    queryKey: ['compliance_alerts', alertId],
    queryFn: async () => {
      if (!alertId) throw new Error('No alert ID')

      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('id', alertId)
        .single()

      if (error) throw error
      return data as ComplianceAlert
    },
    enabled: !!alertId,
  })
}
