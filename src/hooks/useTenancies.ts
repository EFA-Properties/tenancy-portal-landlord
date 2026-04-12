import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Tenancy } from '../types/database'

export function useTenancies(unitId?: string) {
  return useQuery({
    queryKey: ['tenancies', unitId],
    queryFn: async () => {
      let query = supabase.from('tenancies').select('*')
      if (unitId) {
        query = query.eq('unit_id', unitId)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Tenancy[]
    },
  })
}

export function useTenancy(id: string) {
  return useQuery({
    queryKey: ['tenancy', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancies')
        .select(`
          *,
          unit:units(id, name, property:properties(id, address_line1, town, postcode))
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateTenancy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenancy: Omit<Tenancy, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenancies')
        .insert([tenancy])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancies'] })
    },
  })
}

export function useUpdateTenancy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...tenancy }: Tenancy) => {
      const { data, error } = await supabase
        .from('tenancies')
        .update(tenancy)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenancies'] })
      queryClient.setQueryData(['tenancy', data.id], data)
    },
  })
}
