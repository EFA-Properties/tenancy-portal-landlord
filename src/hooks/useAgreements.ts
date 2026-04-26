import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface TenancyAgreement {
  id: string
  tenancy_id: string
  type: 'tenancy_agreement' | 'inventory'
  title: string
  content: string
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'countersigned'
  landlord_signed_at?: string
  landlord_signature_data?: string
  landlord_signature_type?: 'drawn' | 'typed'
  landlord_ip?: string
  tenant_signed_at?: string
  tenant_signature_data?: string
  tenant_signature_type?: 'drawn' | 'typed'
  tenant_ip?: string
  tenant_user_agent?: string
  pdf_storage_path?: string
  sent_at?: string
  created_at: string
  updated_at: string
}

export function useAgreements(tenancyId?: string) {
  return useQuery({
    queryKey: ['agreements', tenancyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .select('*')
        .eq('tenancy_id', tenancyId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TenancyAgreement[]
    },
    enabled: !!tenancyId,
  })
}

export function useAgreement(id?: string) {
  return useQuery({
    queryKey: ['agreement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as TenancyAgreement
    },
    enabled: !!id,
  })
}

export function useCreateAgreement() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      tenancyId: string
      type: 'tenancy_agreement' | 'inventory'
      title: string
      content: string
    }) => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .insert({
          tenancy_id: params.tenancyId,
          type: params.type,
          title: params.title,
          content: params.content,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data as TenancyAgreement
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['agreements', vars.tenancyId] })
    },
  })
}

export function useSignAgreementAsLandlord() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      agreementId: string
      signatureData: string
      signatureType: 'drawn' | 'typed'
    }) => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .update({
          landlord_signed_at: new Date().toISOString(),
          landlord_signature_data: params.signatureData,
          landlord_signature_type: params.signatureType,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', params.agreementId)
        .select()
        .single()

      if (error) throw error
      return data as TenancyAgreement
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agreement', data.id] })
      qc.invalidateQueries({ queryKey: ['agreements', data.tenancy_id] })
    },
  })
}
