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
        .select('*, tenancy_tenants(*, tenants(*))')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: false })

      if (error) throw error
      // Flatten: extract first tenant from junction table
      return (data || []).map((t: any) => ({
        ...t,
        tenants: t.tenancy_tenants?.[0]?.tenants || null,
      }))
    },
    enabled: !!propertyId,
  })
}

export function usePropertyDocuments(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-documents', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')

      const { data, error } = await supabase
        .from('documents')
        .select('id, document_type, title, valid_to, file_path, uploaded_at, served_at, served_to_tenant_id, tenant_opened_at, tenant_confirmed_at, tenants:served_to_tenant_id(full_name)')
        .eq('property_id', propertyId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return data as unknown as Array<{
        id: string
        document_type: string
        title: string
        valid_to: string | null
        file_path: string
        uploaded_at: string
        served_at: string | null
        served_to_tenant_id: string | null
        tenant_opened_at: string | null
        tenant_confirmed_at: string | null
        tenants: { full_name: string } | null
      }>
    },
    enabled: !!propertyId,
  })
}

export function useDocumentAcknowledgements(documentIds: string[]) {
  return useQuery({
    queryKey: ['document-acknowledgements', documentIds],
    queryFn: async () => {
      if (!documentIds.length) return []
      const { data, error } = await supabase
        .from('document_acknowledgements')
        .select('id, document_id, tenant_id, tenancy_id, served_at, opened_at, confirmed_at, tenants:tenant_id(full_name)')
        .in('document_id', documentIds)
      if (error) throw error
      return data as unknown as Array<{
        id: string
        document_id: string
        tenant_id: string
        tenancy_id: string | null
        served_at: string | null
        opened_at: string | null
        confirmed_at: string | null
        tenants: { full_name: string } | null
      }>
    },
    enabled: documentIds.length > 0,
  })
}

export function usePropertyTenants(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-tenants', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')
      // Get all tenants linked to active tenancies for this property
      const { data, error } = await supabase
        .from('tenancy_tenants')
        .select('tenant_id, tenancy_id, tenants(id, full_name), tenancies!inner(id, property_id, status)')
        .eq('tenancies.property_id', propertyId)
        .in('tenancies.status', ['active', 'pending'])
      if (error) throw error
      return data as unknown as Array<{
        tenant_id: string
        tenancy_id: string
        tenants: { id: string; full_name: string } | null
        tenancies: { id: string; property_id: string; status: string }
      }>
    },
    enabled: !!propertyId,
  })
}
