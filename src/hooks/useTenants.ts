import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tenant } from '../types/database'

export interface TenantWithStatus extends Tenant {
  tenancy_status?: 'active' | 'moved_out'
  tenancy_id?: string
  property_address?: string
  moved_out_at?: string
  access_revoked_at?: string
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Tenant[]
    },
  })
}

/**
 * Fetch tenants with their tenancy link status (active/moved_out).
 * Used on the tenants list page to split into Active/Archived tabs.
 */
export function useTenantsWithStatus() {
  return useQuery({
    queryKey: ['tenants-with-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Get all tenants
      const { data: tenants, error: tErr } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (tErr) throw tErr

      // Get all tenancy_tenants links with property info
      const { data: links, error: lErr } = await supabase
        .from('tenancy_tenants')
        .select('tenant_id, tenancy_id, status, moved_out_at, access_revoked_at, tenancies(id, property_id, properties(address_line1, town))')
      if (lErr) throw lErr

      // Merge status onto tenants
      return (tenants || []).map((t) => {
        const link = (links || []).find((l: any) => l.tenant_id === t.id)
        const tenancy = link?.tenancies as any
        return {
          ...t,
          tenancy_status: link?.status || 'active',
          tenancy_id: link?.tenancy_id,
          property_address: tenancy?.properties
            ? `${tenancy.properties.address_line1}, ${tenancy.properties.town}`
            : undefined,
          moved_out_at: link?.moved_out_at,
          access_revoked_at: link?.access_revoked_at,
        } as TenantWithStatus
      })
    },
  })
}

export function useTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID')

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (error) throw error
      return data as Tenant
    },
    enabled: !!tenantId,
  })
}

/**
 * Get the tenancy link status for a specific tenant (active/moved_out, access revoked, etc.)
 */
export function useTenantLinkStatus(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-link-status', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID')
      const { data, error } = await supabase
        .from('tenancy_tenants')
        .select('tenant_id, tenancy_id, status, moved_out_at, move_out_notes, access_revoked_at')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

/**
 * Move a tenant out — sets status to 'moved_out', records timestamp and optional notes.
 */
export function useMoveOutTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tenantId,
      tenancyId,
      notes,
    }: {
      tenantId: string
      tenancyId: string
      notes?: string
    }) => {
      const { error } = await supabase
        .from('tenancy_tenants')
        .update({
          status: 'moved_out',
          moved_out_at: new Date().toISOString(),
          move_out_notes: notes || null,
        })
        .eq('tenant_id', tenantId)
        .eq('tenancy_id', tenancyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants-with-status'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-link-status'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-tenancy'] })
    },
  })
}

/**
 * Revoke a tenant's portal access — sets access_revoked_at timestamp.
 * The tenant portal should check this field and block login if set.
 */
export function useRevokeAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tenantId,
      tenancyId,
    }: {
      tenantId: string
      tenancyId: string
    }) => {
      const { error } = await supabase
        .from('tenancy_tenants')
        .update({
          access_revoked_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('tenancy_id', tenancyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants-with-status'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-link-status'] })
    },
  })
}

/**
 * Restore a moved-out tenant back to active status.
 */
export function useRestoreTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tenantId,
      tenancyId,
    }: {
      tenantId: string
      tenancyId: string
    }) => {
      const { error } = await supabase
        .from('tenancy_tenants')
        .update({
          status: 'active',
          moved_out_at: null,
          move_out_notes: null,
          access_revoked_at: null,
        })
        .eq('tenant_id', tenantId)
        .eq('tenancy_id', tenancyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants-with-status'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-link-status'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-tenancy'] })
    },
  })
}
