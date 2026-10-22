-- Tenancy Portal: tenant records privacy fix
-- Supabase project tenancy-portal (fpgqqxaltegfjhqlhimk). Applied 22 Oct 2026.
begin;

-- 1. Record which landlord created each tenant record.
alter table public.tenants
  add column if not exists landlord_id uuid references public.landlords(id) on delete set null;
create index if not exists idx_tenants_landlord_id on public.tenants(landlord_id);

-- The signed in landlord's id (security definer so it works inside access rules).
create or replace function public.current_landlord_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from landlords where auth_user_id = auth.uid() limit 1;
$$;

-- New tenant records are stamped with the landlord who created them.
alter table public.tenants alter column landlord_id set default public.current_landlord_id();

-- True when the signed in landlord has this tenant on one of their tenancies.
create or replace function public.is_tenant_on_my_tenancy(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from tenancy_tenants tt
    join tenancies t on t.id = tt.tenancy_id
    join landlords l on l.id = t.landlord_id
    where tt.tenant_id = p_tenant_id
      and l.auth_user_id = auth.uid()
  );
$$;

-- 2. Scope the existing rules (altered in place) so landlords only see their own tenants.
alter policy "landlord_read_tenants" on public.tenants
  to authenticated
  using (landlord_id = public.current_landlord_id() or public.is_tenant_on_my_tenancy(id));
alter policy "Landlords can view own tenants" on public.tenants
  to authenticated
  using (landlord_id = public.current_landlord_id() or public.is_tenant_on_my_tenancy(id));
alter policy "Landlords can update own tenants" on public.tenants
  to authenticated
  using (landlord_id = public.current_landlord_id() or public.is_tenant_on_my_tenancy(id))
  with check (landlord_id = public.current_landlord_id() or public.is_tenant_on_my_tenancy(id));

-- Only signed in landlords can create tenant records, and only for themselves.
alter policy "Landlords can insert tenants" on public.tenants
  to authenticated
  with check (landlord_id = public.current_landlord_id());
alter policy "landlord_create_tenants" on public.tenants
  to authenticated
  with check (landlord_id = public.current_landlord_id());

-- Tenants keep reading and updating their own record through the existing rules
-- "Tenants can read own record", "Tenant can update own record" and "tenant_own_record".

-- 3. Invite links. The old rule let anyone on the internet list every pending tenant.
-- It is switched off, and two functions that only work with the secret invite link replace it.
alter policy "Anon can read tenant by invite" on public.tenants
  using (false);

create or replace function public.get_tenant_invite(p_token uuid)
returns table (full_name text, email text, invite_status text, property_address text, landlord_name text)
language sql stable security definer set search_path = public as $$
  select tn.full_name, tn.email, tn.invite_status,
         (select p.address_line1 || ', ' || p.town
            from tenancy_tenants tt
            join tenancies t on t.id = tt.tenancy_id
            join properties p on p.id = t.property_id
           where tt.tenant_id = tn.id
           limit 1),
         coalesce(l.full_name,
           (select l2.full_name
              from tenancy_tenants tt
              join tenancies t on t.id = tt.tenancy_id
              join landlords l2 on l2.id = t.landlord_id
             where tt.tenant_id = tn.id
             limit 1))
  from tenants tn
  left join landlords l on l.id = tn.landlord_id
  where tn.invite_token = p_token;
$$;

-- Links the signed in user to the tenant record, only if the invite link matches,
-- the record is not already claimed and the email matches the invite.
create or replace function public.claim_tenant_invite(p_token uuid)
returns boolean language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  update tenants
     set auth_user_id = auth.uid(), invite_status = 'registered'
   where invite_token = p_token
     and auth_user_id is null
     and lower(email) = lower(auth.jwt() ->> 'email');
  return found;
end;
$$;

revoke all on function public.get_tenant_invite(uuid) from public;
revoke all on function public.claim_tenant_invite(uuid) from public;
grant execute on function public.get_tenant_invite(uuid) to anon, authenticated;
grant execute on function public.claim_tenant_invite(uuid) to authenticated;
revoke all on function public.current_landlord_id() from public, anon;
revoke all on function public.is_tenant_on_my_tenancy(uuid) from public, anon;
grant execute on function public.current_landlord_id() to authenticated;
grant execute on function public.is_tenant_on_my_tenancy(uuid) to authenticated;

commit;
