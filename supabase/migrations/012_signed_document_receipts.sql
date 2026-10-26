-- Tenancy Portal: stamped and signed copies of documents when a tenant confirms receipt
-- Supabase project tenancy-portal (fpgqqxaltegfjhqlhimk)

-- 1. Per tenant timeline and receipt details on each acknowledgement.
--    (The landlord portal already reads served_at, opened_at and confirmed_at.)
alter table public.document_acknowledgements
  add column if not exists served_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists signed_name text,
  add column if not exists original_sha256 text,
  add column if not exists receipt_file_path text,
  add column if not exists receipt_sha256 text;

-- A row created when the landlord serves a document is not a confirmation.
alter table public.document_acknowledgements alter column acknowledged_at drop default;

-- 2. Once confirmed, the confirmation and its signed copy can't be changed.
create or replace function public.lock_confirmed_acknowledgement()
returns trigger language plpgsql as $$
begin
  -- Each confirmation detail can be filled in once, then never changed
  if (old.confirmed_at is not null and new.confirmed_at is distinct from old.confirmed_at)
     or (old.acknowledged_at is not null and new.acknowledged_at is distinct from old.acknowledged_at)
     or (old.signed_name is not null and new.signed_name is distinct from old.signed_name)
     or (old.original_sha256 is not null and new.original_sha256 is distinct from old.original_sha256)
     or (old.receipt_file_path is not null and new.receipt_file_path is distinct from old.receipt_file_path)
     or (old.receipt_sha256 is not null and new.receipt_sha256 is distinct from old.receipt_sha256)
     or (old.confirmed_at is not null and (new.document_id is distinct from old.document_id
                                           or new.tenant_id is distinct from old.tenant_id)) then
    raise exception 'A confirmed receipt cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists lock_confirmed_acknowledgement on public.document_acknowledgements;
create trigger lock_confirmed_acknowledgement
  before update on public.document_acknowledgements
  for each row execute function public.lock_confirmed_acknowledgement();

-- The signed PDF copies themselves can't be deleted by anyone using the portal
-- (no delete rule on the bucket), so they survive even if a document is removed.

-- 3. Private storage for the signed copies. Only the server function can write;
--    the landlord of the tenancy and the tenant themselves can read.
insert into storage.buckets (id, name, public)
values ('document-receipts', 'document-receipts', false)
on conflict (id) do nothing;

create policy "Landlords can view document receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'document-receipts' and exists (
    select 1 from tenancies t join landlords l on l.id = t.landlord_id
    where l.auth_user_id = auth.uid() and t.id::text = (storage.foldername(objects.name))[1]));

create policy "Tenants can view own document receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'document-receipts' and exists (
    select 1 from tenants tn
    where tn.auth_user_id = auth.uid() and tn.id::text = (storage.foldername(objects.name))[2]));

-- 4. Opening and confirming now fill in the per tenant timeline.
create or replace function public.tenant_record_document(p_document_id uuid, p_action text, p_user_agent text default null)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare
  v_tenant uuid;
  v_tenancy uuid;
begin
  if auth.uid() is null or p_action not in ('opened', 'confirmed') then
    return false;
  end if;

  select tn.id, t.id into v_tenant, v_tenancy
  from documents d
  join tenancies t on (d.scope = 'tenancy' and t.id = d.tenancy_id)
                   or (d.scope = 'property' and t.property_id = d.property_id and t.status = 'active')
  join tenancy_tenants tt on tt.tenancy_id = t.id
  join tenants tn on tn.id = tt.tenant_id
  where d.id = p_document_id
    and tn.auth_user_id = auth.uid()
    and coalesce(d.tenant_visible, true)
  limit 1;

  if v_tenant is null then
    return false;
  end if;

  update documents set tenant_opened_at = coalesce(tenant_opened_at, now())
   where id = p_document_id;

  insert into document_acknowledgements (document_id, tenant_id, tenancy_id, opened_at)
  values (p_document_id, v_tenant, v_tenancy, now())
  on conflict (document_id, tenant_id)
  do update set opened_at = coalesce(document_acknowledgements.opened_at, excluded.opened_at);

  if p_action = 'confirmed' then
    update document_acknowledgements
       set confirmed_at = now(),
           acknowledged_at = now(),
           user_agent = left(p_user_agent, 500),
           confirmation_text = 'I confirm I have received and read this document.'
     where document_id = p_document_id and tenant_id = v_tenant
       and confirmed_at is null;
    update documents set tenant_confirmed_at = coalesce(tenant_confirmed_at, now())
     where id = p_document_id;
  end if;

  return true;
end;
$$;
