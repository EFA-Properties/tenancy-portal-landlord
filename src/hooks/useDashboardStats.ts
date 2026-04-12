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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Get total and active tenancies
      const { data: tenancies } = await supabase
        .from('tenancies')
        .select('status')

      const totalTenancies = tenancies?.length ?? 0
      const activeTenancies = tenancies?.filter(t => t.status === 'active').length ?? 0

      // Get pending maintenance requests
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id')
        .in('status', ['open', 'in_progress'])

      const pendingRequests = requests?.length ?? 0

      // Get overdue compliance alerts
      const today = new Date().toISOString().split('T')[0]
      const { data: alerts } = await supabase
        .from('compliance_alerts')
        .select('id')
        .eq('status', 'pending')
        .lt('due_date', today)

      const overdueAlerts = alerts?.length ?? 0

      return {
        totalTenancies,
        activeTenancies,
        pendingRequests,
        overdueAlerts,
      }
    },
  })
}
