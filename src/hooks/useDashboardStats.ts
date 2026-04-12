import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/supabase'

export interface DashboardStats {
  totalProperties: number
  activeTenancies: number
  complianceAlerts: number
  pendingMaintenance: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      // Get all legal entities for this landlord
      const { data: legalEntities } = await supabase
        .from('legal_entities')
        .select('id')
        .eq('landlord_id', user.id)

      const entityIds = legalEntities?.map(e => e.id) || []

      // Count properties
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .in('legal_entity_id', entityIds.length > 0 ? entityIds : ['null'])

      // Count active tenancies
      const { count: tenancyCount } = await supabase
        .from('tenancies')
        .select('*', { count: 'exact' })
        .eq('status', 'active')

      // Count compliance alerts
      const { count: alertCount } = await supabase
        .from('compliance_alerts')
        .select('*', { count: 'exact' })
        .eq('landlord_id', user.id)
        .eq('is_resolved', false)

      // Count pending maintenance
      const { count: maintenanceCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact' })
        .neq('status', 'resolved')

      return {
        totalProperties: propertyCount || 0,
        activeTenancies: tenancyCount || 0,
        complianceAlerts: alertCount || 0,
        pendingMaintenance: maintenanceCount || 0,
      } as DashboardStats
    },
  })
}

export function useUpcomingDocumentExpiries() {
  return useQuery({
    queryKey: ['upcoming_expiries'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data, error } = await supabase
        .from('documents')
        .select('*, property:properties(address_line1, town)')
        .not('valid_to', 'is', null)
        .lte('valid_to', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('valid_to', new Date().toISOString().split('T')[0])
        .order('valid_to', { ascending: true })
        .limit(10)

      if (error) throw error
      return data
    },
  })
}

export function useRecentMaintenanceRequests() {
  return useQuery({
    queryKey: ['recent_maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          tenancy:tenancies(
            unit:units(property:properties(address_line1, town))
          )
        `)
        .neq('status', 'resolved')
        .order('reported_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
  })
}
