export interface Database {
  public: {
    Tables: {
      landlords: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string
          email: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          full_name: string
          email: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      legal_entities: {
        Row: {
          id: string
          landlord_id: string
          name: string
          company_number: string | null
          is_company: boolean
          registered_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          name: string
          company_number?: string | null
          is_company?: boolean
          registered_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          name?: string
          company_number?: string | null
          is_company?: boolean
          registered_address?: string | null
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          legal_entity_id: string
          landlord_id: string
          address_line1: string
          address_line2: string | null
          town: string
          county: string | null
          postcode: string
          uprn: string | null
          property_type: 'btl' | 'hmo' | 'commercial' | 'holiday_let' | null
          is_hmo: boolean
          hmo_licence_number: string | null
          hmo_licence_expiry: string | null
          max_occupants: number | null
          epc_rating: string | null
          epc_score: number | null
          epc_expiry: string | null
          eicr_status: string | null
          eicr_expiry: string | null
          gas_safety_expiry: string | null
          fire_risk_expiry: string | null
          pat_expiry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          legal_entity_id: string
          landlord_id: string
          address_line1: string
          address_line2?: string | null
          town: string
          county?: string | null
          postcode: string
          uprn?: string | null
          property_type?: 'btl' | 'hmo' | 'commercial' | 'holiday_let' | null
          is_hmo?: boolean
          hmo_licence_number?: string | null
          hmo_licence_expiry?: string | null
          max_occupants?: number | null
          epc_rating?: string | null
          epc_score?: number | null
          epc_expiry?: string | null
          eicr_status?: string | null
          eicr_expiry?: string | null
          gas_safety_expiry?: string | null
          fire_risk_expiry?: string | null
          pat_expiry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          legal_entity_id?: string
          landlord_id?: string
          address_line1?: string
          address_line2?: string | null
          town?: string
          county?: string | null
          postcode?: string
          uprn?: string | null
          property_type?: 'btl' | 'hmo' | 'commercial' | 'holiday_let' | null
          is_hmo?: boolean
          hmo_licence_number?: string | null
          hmo_licence_expiry?: string | null
          max_occupants?: number | null
          epc_rating?: string | null
          epc_score?: number | null
          epc_expiry?: string | null
          eicr_status?: string | null
          eicr_expiry?: string | null
          gas_safety_expiry?: string | null
          fire_risk_expiry?: string | null
          pat_expiry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          name: string
          floor: string | null
          description: string | null
          monthly_rent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          floor?: string | null
          description?: string | null
          monthly_rent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          name?: string
          floor?: string | null
          description?: string | null
          monthly_rent?: number | null
          created_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          auth_user_id: string | null
          full_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          date_of_birth?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenancies: {
        Row: {
          id: string
          unit_id: string
          property_id: string
          legal_entity_id: string
          landlord_id: string
          tenancy_type: 'periodic' | 'fixed_term'
          start_date: string
          end_date: string | null
          monthly_rent: number
          rent_due_day: number
          deposit_amount: number | null
          deposit_scheme: 'dps' | 'tds' | 'mydeposits' | null
          deposit_scheme_ref: string | null
          deposit_protected_date: string | null
          status: 'active' | 'ended' | 'pending'
          prs_registered: boolean
          how_to_rent_served: boolean
          how_to_rent_edition: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          property_id: string
          legal_entity_id: string
          landlord_id: string
          tenancy_type?: 'periodic' | 'fixed_term'
          start_date: string
          end_date?: string | null
          monthly_rent: number
          rent_due_day?: number
          deposit_amount?: number | null
          deposit_scheme?: 'dps' | 'tds' | 'mydeposits' | null
          deposit_scheme_ref?: string | null
          deposit_protected_date?: string | null
          status?: 'active' | 'ended' | 'pending'
          prs_registered?: boolean
          how_to_rent_served?: boolean
          how_to_rent_edition?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          property_id?: string
          legal_entity_id?: string
          landlord_id?: string
          tenancy_type?: 'periodic' | 'fixed_term'
          start_date?: string
          end_date?: string | null
          monthly_rent?: number
          rent_due_day?: number
          deposit_amount?: number | null
          deposit_scheme?: 'dps' | 'tds' | 'mydeposits' | null
          deposit_scheme_ref?: string | null
          deposit_protected_date?: string | null
          status?: 'active' | 'ended' | 'pending'
          prs_registered?: boolean
          how_to_rent_served?: boolean
          how_to_rent_edition?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenancy_tenants: {
        Row: {
          id: string
          tenancy_id: string
          tenant_id: string
          is_lead_tenant: boolean
          added_at: string
        }
        Insert: {
          id?: string
          tenancy_id: string
          tenant_id: string
          is_lead_tenant?: boolean
          added_at?: string
        }
        Update: {
          id?: string
          tenancy_id?: string
          tenant_id?: string
          is_lead_tenant?: boolean
          added_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          landlord_id: string
          scope: 'property' | 'tenancy'
          property_id: string | null
          tenancy_id: string | null
          document_type: string
          title: string
          description: string | null
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          valid_from: string | null
          valid_to: string | null
          requires_acknowledgement: boolean
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          landlord_id: string
          scope: 'property' | 'tenancy'
          property_id?: string | null
          tenancy_id?: string | null
          document_type: string
          title: string
          description?: string | null
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          valid_from?: string | null
          valid_to?: string | null
          requires_acknowledgement?: boolean
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          landlord_id?: string
          scope?: 'property' | 'tenancy'
          property_id?: string | null
          tenancy_id?: string | null
          document_type?: string
          title?: string
          description?: string | null
          file_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          valid_from?: string | null
          valid_to?: string | null
          requires_acknowledgement?: boolean
          uploaded_at?: string
          uploaded_by?: string | null
        }
      }
      document_acknowledgements: {
        Row: {
          id: string
          document_id: string
          tenant_id: string
          tenancy_id: string
          acknowledged_at: string
          ip_address: string | null
          user_agent: string | null
          confirmation_text: string | null
        }
        Insert: {
          id?: string
          document_id: string
          tenant_id: string
          tenancy_id: string
          acknowledged_at?: string
          ip_address?: string | null
          user_agent?: string | null
          confirmation_text?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          tenant_id?: string
          tenancy_id?: string
          acknowledged_at?: string
          ip_address?: string | null
          user_agent?: string | null
          confirmation_text?: string | null
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          tenancy_id: string
          property_id: string
          unit_id: string | null
          tenant_id: string
          title: string
          description: string
          category: 'plumbing' | 'electrical' | 'heating' | 'structural' | 'damp_mould' | 'appliance' | 'security' | 'other' | null
          priority: 'emergency' | 'urgent' | 'routine'
          is_awaab_applicable: boolean
          awaab_response_deadline: string | null
          status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
          reported_at: string
          acknowledged_at: string | null
          resolved_at: string | null
          landlord_notes: string | null
          resolution_notes: string | null
        }
        Insert: {
          id?: string
          tenancy_id: string
          property_id: string
          unit_id?: string | null
          tenant_id: string
          title: string
          description: string
          category?: 'plumbing' | 'electrical' | 'heating' | 'structural' | 'damp_mould' | 'appliance' | 'security' | 'other' | null
          priority?: 'emergency' | 'urgent' | 'routine'
          is_awaab_applicable?: boolean
          awaab_response_deadline?: string | null
          status?: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
          reported_at?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
          landlord_notes?: string | null
          resolution_notes?: string | null
        }
        Update: {
          id?: string
          tenancy_id?: string
          property_id?: string
          unit_id?: string | null
          tenant_id?: string
          title?: string
          description?: string
          category?: 'plumbing' | 'electrical' | 'heating' | 'structural' | 'damp_mould' | 'appliance' | 'security' | 'other' | null
          priority?: 'emergency' | 'urgent' | 'routine'
          is_awaab_applicable?: boolean
          awaab_response_deadline?: string | null
          status?: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
          reported_at?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
          landlord_notes?: string | null
          resolution_notes?: string | null
        }
      }
      compliance_alerts: {
        Row: {
          id: string
          landlord_id: string
          property_id: string
          alert_type: string
          alert_level: 'info' | 'warning' | 'critical' | 'overdue' | null
          expiry_date: string | null
          days_until_expiry: number | null
          message: string
          is_resolved: boolean
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          property_id: string
          alert_type: string
          alert_level?: 'info' | 'warning' | 'critical' | 'overdue' | null
          expiry_date?: string | null
          days_until_expiry?: number | null
          message: string
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          property_id?: string
          alert_type?: string
          alert_level?: 'info' | 'warning' | 'critical' | 'overdue' | null
          expiry_date?: string | null
          days_until_expiry?: number | null
          message?: string
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
      }
      portal_invites: {
        Row: {
          id: string
          tenant_id: string
          tenancy_id: string
          email: string
          token: string
          expires_at: string
          used_at: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tenancy_id: string
          email: string
          token: string
          expires_at: string
          used_at?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          tenancy_id?: string
          email?: string
          token?: string
          expires_at?: string
          used_at?: string | null
          sent_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Convenience type aliases
export type Landlord = Database['public']['Tables']['landlords']['Row']
export type LegalEntity = Database['public']['Tables']['legal_entities']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Unit = Database['public']['Tables']['units']['Row']
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type Tenancy = Database['public']['Tables']['tenancies']['Row']
export type TenancyTenant = Database['public']['Tables']['tenancy_tenants']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentAcknowledgement = Database['public']['Tables']['document_acknowledgements']['Row']
export type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row']
export type ComplianceAlert = Database['public']['Tables']['compliance_alerts']['Row']
export type PortalInvite = Database['public']['Tables']['portal_invites']['Row']

// Document type enums for convenience
export const PROPERTY_DOC_TYPES = ['epc', 'cp12', 'eicr', 'hmo_licence', 'fire_risk', 'pat', 'property_info'] as const
export const TENANCY_DOC_TYPES = ['ast', 'deposit_cert', 'how_to_rent', 'inventory', 's13_notice', 's8_notice', 'other'] as const
export type PropertyDocType = typeof PROPERTY_DOC_TYPES[number]
export type TenancyDocType = typeof TENANCY_DOC_TYPES[number]

// Property type labels
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  btl: 'Buy to Let',
  hmo: 'HMO',
  commercial: 'Commercial',
  holiday_let: 'Holiday Let',
}

// Document type labels
export const DOC_TYPE_LABELS: Record<string, string> = {
  epc: 'EPC',
  cp12: 'Gas Safety (CP12)',
  eicr: 'EICR',
  hmo_licence: 'HMO Licence',
  fire_risk: 'Fire Risk Assessment',
  pat: 'PAT Testing',
  property_info: 'Property Info',
  ast: 'AST',
  deposit_cert: 'Deposit Certificate',
  how_to_rent: 'How to Rent',
  inventory: 'Inventory',
  s13_notice: 'Section 13 Notice',
  s8_notice: 'Section 8 Notice',
  other: 'Other',
}

// Alert level labels and colours
export const ALERT_LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  info: { label: 'Info', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  warning: { label: 'Warning', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-50' },
  overdue: { label: 'Overdue', color: 'text-red-900', bgColor: 'bg-red-100' },
}
