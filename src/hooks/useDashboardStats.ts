import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DashboardStats {
  totalTenancies: number
  activeTenancies: number
  pendingRequests: number
  overdueAlerts: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      // Run all three queries in parallel
      const [tenanciesRes, requestsRes, alertsRes] = await Promise.all([
        supabase.from('tenancies').select('status', { count: 'exact', head: false }),
        supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('compliance_alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', today),
      ])

      const tenancies = tenanciesRes.data
      const totalTenancies = tenancies?.length ?? 0
      const activeTenancies = tenancies?.filter(t => t.status === 'active').length ?? 0
      const pendingRequests = requestsRes.count ?? requestsRes.data?.length ?? 0
      const overdueAlerts = alertsRes.count ?? alertsRes.data?.length ?? 0

      return {
        totalTenancies,
        activeTenancies,
        pendingRequests,
        overdueAlerts,
      }
    },
  })
}
