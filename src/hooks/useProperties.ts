import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, legal_entities(id, name, company_number)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Property & { legal_entities: any })[]
    },
  })
}

export function useProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['properties', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')

      const { data, error } = await supabase
        .from('properties')
        .select('*, legal_entities(id, name, company_number)')
        .eq('id', propertyId)
        .single()

      if (error) throw error
      return data as Property & { legal_entities: any }
    },
    enabled: !!propertyId,
  })
}

export function usePropertyTenancies(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-tenancies', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')

      const { data, error } = await supabase
        .from('tenancies')
        .select('*, tenants(*)')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!propertyId,
  })
}
