-- Tenancy Portal: "What's Changing" updates for landlords about upcoming rule changes
-- Supabase project tenancy-portal (fpgqqxaltegfjhqlhimk)
-- Updates are written by the Tenancy Portal team and only appear once published_at is set.

create table if not exists public.landlord_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  -- 'all' or property types from the properties table: btl, hmo, holiday_let, commercial
  applies_to text[] not null default array['all'],
  takes_effect date,
  status text not null default 'heads_up' check (status in ('heads_up', 'action_needed')),
  source_url text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.landlord_updates enable row level security;

-- Signed in users can read published updates. Nobody can write from the portal;
-- updates are added by the Tenancy Portal team in Supabase.
drop policy if exists "Signed in users read published updates" on public.landlord_updates;
create policy "Signed in users read published updates" on public.landlord_updates
  for select to authenticated
  using (published_at is not null and published_at <= now());
