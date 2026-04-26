export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string
          city: string
          postcode: string
          property_type: string
          bedrooms: number
          bathrooms: number
          description: string | null
          epc_rating: string | null
          epc_score: number | null
          epc_expiry: string | null
          epc_certificate_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address: string
          city: string
          postcode: string
          property_type: string
          bedrooms: number
          bathrooms: number
          description?: string | null
          epc_rating?: string | null
          epc_score?: number | null
          epc_expiry?: string | null
          epc_certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string
          city?: string
          postcode?: string
          property_type?: string
          bedrooms?: number
          bathrooms?: number
          description?: string | null
          epc_rating?: string | null
          epc_score?: number | null
          epc_expiry?: string | null
          epc_certificate_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenancies: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          start_date: string
          end_date: string | null
          monthly_rent: number
          status: 'active' | 'ended' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          start_date: string
          end_date?: string | null
          monthly_rent: number
          status?: 'active' | 'ended' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          start_date?: string
          end_date?: string | null
          monthly_rent?: number
          status?: 'active' | 'ended' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          invite_status: string | null
          invite_token: string | null
          invited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email: string
          phone?: string | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          invite_status?: string | null
          invited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          invite_status?: string | null
          invited_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          tenancy_id: string
          name: string
          type: string
          url: string
          uploaded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenancy_id: string
          name: string
          type: string
          url: string
          uploaded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenancy_id?: string
          name?: string
          type?: string
          url?: string
          uploaded_at?: string
          created_at?: string
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          tenancy_id: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          tenancy_id: string
          title: string
          description: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          tenancy_id?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      compliance_alerts: {
        Row: {
          id: string
          property_id: string
          alert_type: string
          title: string
          description: string
          due_date: string
          status: 'pending' | 'completed' | 'overdue'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          alert_type: string
          title: string
          description: string
          due_date: string
          status?: 'pending' | 'completed' | 'overdue'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          alert_type?: string
          title?: string
          description?: string
          due_date?: string
          status?: 'pending' | 'completed' | 'overdue'
          created_at?: string
          updated_at?: string
        }
      }
      legal_entities: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'individual' | 'limited_company' | 'partnership'
          registration_number: string | null
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'individual' | 'limited_company' | 'partnership'
          registration_number?: string | null
          address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'individual' | 'limited_company' | 'partnership'
          registration_number?: string | null
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Application types
export interface Property {
  id: string
  landlord_id: string | null
  legal_entity_id: string | null
  address_line1: string
  address_line2: string | null
  town: string
  county: string | null
  postcode: string
  uprn: string | null
  property_type: string | null
  is_hmo: boolean
  hmo_licence_number: string | null
  hmo_licence_expiry: string | null
  max_occupants: number | null
  epc_rating: string | null
  epc_score: number | null
  epc_expiry: string | null
  epc_certificate_url: string | null
  eicr_status: string | null
  eicr_expiry: string | null
  gas_safety_expiry: string | null
  fire_risk_expiry: string | null
  pat_expiry: string | null
  compliance_overrides: Record<string, string> | null
  created_at: string
  updated_at: string
}

export interface Tenancy {
  id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string | null
  monthly_rent: number
  status: 'active' | 'ended' | 'pending'
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  invite_status: 'invited' | 'registered' | null
  invite_token: string | null
  invited_at: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  tenancy_id: string
  name: string
  type: string
  url: string
  uploaded_at: string
  created_at: string
}

export interface MaintenanceRequest {
  id: string
  tenancy_id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface ComplianceAlert {
  id: string
  property_id: string
  alert_type: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'completed' | 'overdue'
  created_at: string
  updated_at: string
}

export interface LegalEntity {
  id: string
  user_id: string
  name: string
  type: 'individual' | 'limited_company' | 'partnership'
  registration_number: string | null
  address: string
  created_at: string
  updated_at: string
}
