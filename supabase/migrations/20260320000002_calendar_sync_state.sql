-- Adds sync state tracking to calendar_connections so we know if a connection
-- is healthy without making a live API call, and a mapping table so we can
-- update or delete Google Calendar events when bookings change.

-- ─── calendar_connections: sync state columns ─────────────────────────────────
alter table calendar_connections
  add column if not exists sync_status text
    check (sync_status in ('active', 'syncing', 'error', 'revoked'))
    not null default 'active',
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_error text;           -- last error message if sync_status = 'error'

-- ─── calendar_event_mappings ──────────────────────────────────────────────────
-- Maps a Clubstack booking_date to the Google Calendar event we created for it.
-- Needed for write-back: when a booking is confirmed we create a GCal event;
-- when it's cancelled or rescheduled we need the gcal_event_id to update/delete it.
create table calendar_event_mappings (
  id uuid primary key default gen_random_uuid(),
  booking_date_id uuid not null references booking_dates(id) on delete cascade,
  dj_profile_id uuid not null references dj_profiles(id) on delete cascade,
  gcal_event_id text not null,         -- Google Calendar event ID (from GCal API response)
  calendar_id text not null default 'primary',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(booking_date_id, dj_profile_id)
);

create trigger set_calendar_event_mappings_updated_at
  before update on calendar_event_mappings
  for each row
  execute function update_updated_at();

alter table calendar_event_mappings enable row level security;

-- DJ can see their own event mappings
create policy "DJ can read own event mappings"
  on calendar_event_mappings for select
  using (
    dj_profile_id in (
      select id from dj_profiles where user_id = auth.uid()
    )
  );

-- Agency can see event mappings for their rostered DJs
create policy "Agency can read rostered DJ event mappings"
  on calendar_event_mappings for select
  using (
    dj_profile_id in (
      select aa.dj_profile_id
      from agency_artists aa
      join agencies a on a.id = aa.agency_id
      where a.user_id = auth.uid()
        and aa.status = 'active'
    )
  );

-- Server-only mutations (service role bypasses RLS)
create policy "No client inserts on event mappings"
  on calendar_event_mappings for insert
  with check (false);

create policy "No client updates on event mappings"
  on calendar_event_mappings for update
  using (false);

create policy "No client deletes on event mappings"
  on calendar_event_mappings for delete
  using (false);
