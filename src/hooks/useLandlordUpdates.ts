import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { LandlordUpdate } from '../types/database'

export function useLandlordUpdates() {
  return useQuery({
    queryKey: ['landlord_updates'],
    // published_at holds the date the government announced the change
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_updates')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) throw error
      // Updates that need action first, then newest announcement first
      return (data as LandlordUpdate[]).sort(
        (a, b) => Number(b.status === 'action_needed') - Number(a.status === 'action_needed'),
      )
    },
  })
}
