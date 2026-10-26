-- Tenancy Portal: remember which "What's Changing" updates have been emailed to landlords
-- Supabase project tenancy-portal (fpgqqxaltegfjhqlhimk)
-- emailed_status records the status last emailed, so a heads up is sent once and a
-- second email goes out only when the same update later moves to 'action_needed'.

alter table public.landlord_updates
  add column if not exists emailed_status text,
  add column if not exists emailed_at timestamptz;

-- When an update is published (or moves to 'action_needed'), ask the landlord portal to
-- email it. The portal function only sends published updates it hasn't already sent.
create or replace function public.send_landlord_update_emails()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.published_at is not null and new.emailed_status is distinct from new.status then
    perform net.http_post(
      url := 'https://landlord.tenancy-portal.co.uk/api/send-landlord-updates',
      body := '{}'::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end if;
  return new;
end;
$$;

drop trigger if exists send_landlord_update_emails on public.landlord_updates;
create trigger send_landlord_update_emails
  after insert or update of published_at, status on public.landlord_updates
  for each row execute function public.send_landlord_update_emails();
