-- Allow tenants to read agreements for their tenancies (non-draft only)
CREATE POLICY "Tenants can view their agreements"
  ON tenancy_agreements FOR SELECT
  USING (
    status != 'draft'
    AND tenancy_id IN (
      SELECT tt.tenancy_id FROM tenancy_tenants tt
      JOIN tenants tn ON tt.tenant_id = tn.id
      WHERE tn.auth_user_id = auth.uid()
    )
  );

-- Allow tenants to update agreements (for signing — restricted to sent/viewed status)
CREATE POLICY "Tenants can sign their agreements"
  ON tenancy_agreements FOR UPDATE
  USING (
    status IN ('sent', 'viewed')
    AND tenancy_id IN (
      SELECT tt.tenancy_id FROM tenancy_tenants tt
      JOIN tenants tn ON tt.tenant_id = tn.id
      WHERE tn.auth_user_id = auth.uid()
    )
  );
