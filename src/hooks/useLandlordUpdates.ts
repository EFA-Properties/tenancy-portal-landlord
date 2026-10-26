import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { LandlordUpdate } from '../types/database'

export function useLandlordUpdates() {
  return useQuery({
    queryKey: ['landlord_updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_updates')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) throw error
      return data as LandlordUpdate[]
    },
  })
}
