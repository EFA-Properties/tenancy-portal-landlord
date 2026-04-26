import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface Landlord {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  phone?: string
  portfolio_type: 'btl' | 'hmo' | 'hybrid'
  property_count_range: '1' | '2-10' | '11-25' | '25+'
  plan: 'free' | 'pro'
  plan_price: number
  billing_active: boolean
  trial_ends_at?: string
  gc_customer_id?: string
  gc_mandate_id?: string
  gc_subscription_id?: string
  billing_grace_until?: string
  comped: boolean
  promo_code_id?: string
  promo_applied_at?: string
  promo_expires_at?: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export function useLandlord() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['landlord', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('landlords')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error) throw error
      return data as Landlord
    },
    enabled: !!user,
  })
}
