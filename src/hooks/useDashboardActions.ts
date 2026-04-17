import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type ActionPriority = 'urgent' | 'warning' | 'info'

export interface DashboardAction {
  id: string
  priority: ActionPriority
  title: string
  description: string
  propertyAddress: string
  propertyId: string
  link: string
  category: 'expiry' | 'missing_doc' | 'tenant'
}

/**
 * Fetches real-time actionable items for the dashboard:
 * - Certificates expiring within 30 days (or already expired)
 * - Properties missing key compliance documents
 * - Tenants needing attention (moved out but access not revoked)
 */
export function useDashboardActions() {
  return useQuery({
    queryKey: ['dashboard-actions'],
    queryFn: async () => {
      const actions: DashboardAction[] = []
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // Days from today helper
      const addDays = (d: Date, n: number) => {
        const r = new Date(d)
        r.setDate(r.getDate() + n)
        return r.toISOString().split('T')[0]
      }
      const in30 = addDays(today, 30)

      // --------------------------------------------------
      // 1. Expiring / expired certificates from properties
      // --------------------------------------------------
      const { data: properties } = await supabase
        .from('properties')
        .select('id, address_line1, town, postcode, gas_safety_expiry, epc_expiry, eicr_expiry, compliance_overrides')

      if (properties) {
        const certFields = [
          { field: 'gas_safety_expiry' as const, label: 'Gas Safety (CP12)', docType: 'gas_safety' },
          { field: 'epc_expiry' as const, label: 'EPC Certificate', docType: 'epc' },
          { field: 'eicr_expiry' as const, label: 'EICR (Electrical Safety)', docType: 'eicr' },
        ]

        for (const prop of properties) {
          const address = `${prop.address_line1}, ${prop.town}`
          const overrides = (prop.compliance_overrides as Record<string, string>) || {}

          for (const cert of certFields) {
            // Skip if marked N/A
            if (overrides[cert.docType] === 'na') continue

            const expiry = (prop as any)[cert.field] as string | null
            if (!expiry) continue

            if (expiry <= todayStr) {
              actions.push({
                id: `${prop.id}-${cert.field}-expired`,
                priority: 'urgent',
                title: `${cert.label} expired`,
                description: `Expired on ${formatDateShort(expiry)}. Upload a renewed certificate.`,
                propertyAddress: address,
                propertyId: prop.id,
                link: `/properties/${prop.id}`,
                category: 'expiry',
              })
            } else if (expiry <= in30) {
              const daysLeft = Math.ceil((new Date(expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              actions.push({
                id: `${prop.id}-${cert.field}-expiring`,
                priority: daysLeft <= 7 ? 'warning' : 'info',
                title: `${cert.label} expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                description: `Expires ${formatDateShort(expiry)}. Arrange renewal.`,
                propertyAddress: address,
                propertyId: prop.id,
                link: `/properties/${prop.id}`,
                category: 'expiry',
              })
            }
          }
        }
      }

      // --------------------------------------------------
      // 2. Properties missing key documents
      // --------------------------------------------------
      const { data: allDocs } = await supabase
        .from('documents')
        .select('property_id, document_type')

      if (properties && allDocs) {
        const docsByProperty = new Map<string, Set<string>>()
        for (const doc of allDocs) {
          if (!doc.property_id) continue
          if (!docsByProperty.has(doc.property_id)) docsByProperty.set(doc.property_id, new Set())
          docsByProperty.get(doc.property_id)!.add(doc.document_type)
        }

        const requiredDocs = [
          { type: 'gas_safety', label: 'Gas Safety Certificate', expiryField: 'gas_safety_expiry' },
          { type: 'epc', label: 'EPC Certificate', expiryField: 'epc_expiry' },
          { type: 'eicr', label: 'EICR Report', expiryField: 'eicr_expiry' },
        ]

        for (const prop of properties) {
          const address = `${prop.address_line1}, ${prop.town}`
          const overrides = (prop.compliance_overrides as Record<string, string>) || {}
          const propDocs = docsByProperty.get(prop.id) || new Set()

          for (const req of requiredDocs) {
            if (overrides[req.type] === 'na') continue
            // Only flag missing if no document uploaded AND no expiry date set on property
            const hasExpiry = !!(prop as any)[req.expiryField]
            if (!propDocs.has(req.type) && !hasExpiry) {
              actions.push({
                id: `${prop.id}-missing-${req.type}`,
                priority: 'warning',
                title: `${req.label} not uploaded`,
                description: `No certificate on file for this property.`,
                propertyAddress: address,
                propertyId: prop.id,
                link: `/documents/upload?property_id=${prop.id}&document_type=${req.type}`,
                category: 'missing_doc',
              })
            }
          }
        }
      }

      // --------------------------------------------------
      // 3. Tenants needing attention
      // --------------------------------------------------
      const { data: tenantLinks } = await supabase
        .from('tenancy_tenants')
        .select('tenant_id, tenancy_id, status, moved_out_at, access_revoked_at, tenants(full_name), tenancies(property_id, properties(address_line1, town))')
        .eq('status', 'moved_out')
        .is('access_revoked_at', null)

      if (tenantLinks) {
        for (const link of tenantLinks as any[]) {
          const tenantName = link.tenants?.full_name || 'Unknown tenant'
          const prop = link.tenancies?.properties
          const address = prop ? `${prop.address_line1}, ${prop.town}` : 'Unknown property'
          const propertyId = link.tenancies?.property_id || ''

          actions.push({
            id: `tenant-access-${link.tenant_id}`,
            priority: 'warning',
            title: `Revoke access for ${tenantName}`,
            description: `Moved out but still has portal access.`,
            propertyAddress: address,
            propertyId,
            link: `/tenants/${link.tenant_id}`,
            category: 'tenant',
          })
        }
      }

      // Sort: urgent first, then warning, then info
      const priorityOrder: Record<ActionPriority, number> = { urgent: 0, warning: 1, info: 2 }
      actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

      return actions
    },
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
