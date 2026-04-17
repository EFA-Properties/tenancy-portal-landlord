import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface RightToRentCheck {
  id: string
  landlord_id: string
  tenancy_id: string
  tenant_id: string
  check_date: string
  document_type_checked: string
  expiry_date: string | null
  next_check_due: string | null
  result: string
  notes: string | null
  document_id: string | null
  created_at: string
  updated_at: string
}

export function useRightToRentChecks(tenancyId: string | undefined) {
  return useQuery({
    queryKey: ['right-to-rent', tenancyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')
      const { data, error } = await supabase
        .from('right_to_rent_checks')
        .select('*, tenants(full_name)')
        .eq('tenancy_id', tenancyId)
        .order('check_date', { ascending: false })
      if (error) throw error
      return data as (RightToRentCheck & { tenants: { full_name: string } | null })[]
    },
    enabled: !!tenancyId,
  })
}

export function useRightToRentByProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['right-to-rent-property', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')
      const { data, error } = await supabase
        .from('right_to_rent_checks')
        .select('*, tenants(full_name), tenancies!inner(property_id)')
        .eq('tenancies.property_id', propertyId)
        .order('check_date', { ascending: false })
      if (error) throw error
      return data as unknown as (RightToRentCheck & { tenants: { full_name: string } | null })[]
    },
    enabled: !!propertyId,
  })
}

export function useCreateRightToRentCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (check: {
      landlord_id: string
      tenancy_id: string
      tenant_id: string
      check_date: string
      document_type_checked: string
      expiry_date?: string | null
      next_check_due?: string | null
      result?: string
      notes?: string | null
      document_id?: string | null
    }) => {
      const { data, error } = await supabase
        .from('right_to_rent_checks')
        .insert(check)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['right-to-rent', variables.tenancy_id] })
      queryClient.invalidateQueries({ queryKey: ['right-to-rent-property'] })
    },
  })
}
