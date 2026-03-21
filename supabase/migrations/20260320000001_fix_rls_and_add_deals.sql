-- Fix RLS policies that used unfiltered "select id from bookings" subqueries.
-- The old pattern relied on RLS being applied recursively to the subquery,
-- which is fragile and unclear. Replace with explicit EXISTS checks that
-- enumerate all three roles: booking creator, payer, and DJ on the booking.
--
-- Also fixes payments/transfers INSERT/UPDATE policies that allowed any
-- authenticated user to mutate records. These tables are server-only (via
-- service role which bypasses RLS). Client-side mutations are disallowed.
--
-- Also adds: deals table (gross fee + currency), end_time on booking_dates.

-- ─── Helper: reusable booking access check ───────────────────────────────────
-- A user can access booking-related rows if they are:
--   (a) the creator (agency or DJ who created the booking)
--   (b) the designated payer (venue/promoter contact)
--   (c) a DJ whose profile is on the booking
--
-- We express this as an EXISTS subquery in each policy below.

-- ─── booking_dates ────────────────────────────────────────────────────────────
drop policy if exists "Booking dates follow booking access" on booking_dates;

create policy "Booking dates follow booking access"
  on booking_dates for select
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_dates.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- Add end_time so we know when a set finishes (needed for auto fund-release cron)
alter table booking_dates add column if not exists end_time time;

-- ─── booking_artists ─────────────────────────────────────────────────────────
drop policy if exists "Booking artists follow booking access" on booking_artists;

create policy "Booking artists follow booking access"
  on booking_artists for select
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_artists.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba2
            join dj_profiles dp on dp.id = ba2.dj_profile_id
            where ba2.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- ─── booking_costs ────────────────────────────────────────────────────────────
drop policy if exists "Booking costs follow booking access" on booking_costs;

create policy "Booking costs follow booking access"
  on booking_costs for select
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_costs.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- ─── contracts ────────────────────────────────────────────────────────────────
drop policy if exists "Contract follows booking access" on contracts;

create policy "Contract follows booking access"
  on contracts for select
  using (
    exists (
      select 1 from bookings b
      where b.id = contracts.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- ─── invoices ─────────────────────────────────────────────────────────────────
drop policy if exists "Invoices follow booking access" on invoices;

create policy "Invoices follow booking access"
  on invoices for select
  using (
    exists (
      select 1 from bookings b
      where b.id = invoices.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- ─── threads ──────────────────────────────────────────────────────────────────
drop policy if exists "Threads follow booking access" on threads;
drop policy if exists "Booking participants can create threads" on threads;

create policy "Threads follow booking access"
  on threads for select
  using (
    exists (
      select 1 from bookings b
      where b.id = threads.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

create policy "Booking participants can create threads"
  on threads for insert
  with check (
    exists (
      select 1 from bookings b
      where b.id = threads.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
        )
    )
  );

-- ─── messages ─────────────────────────────────────────────────────────────────
drop policy if exists "Messages follow thread access" on messages;
drop policy if exists "Thread participants can send messages" on messages;

create policy "Messages follow thread access"
  on messages for select
  using (
    exists (
      select 1 from threads t
      join bookings b on b.id = t.booking_id
      where t.id = messages.thread_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

create policy "Thread participants can send messages"
  on messages for insert
  with check (
    exists (
      select 1 from threads t
      join bookings b on b.id = t.booking_id
      where t.id = messages.thread_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
    and (
      sender_id = auth.uid()
      or (sender_id is null and is_system = true)
    )
  );

-- ─── travel ───────────────────────────────────────────────────────────────────
drop policy if exists "Travel follows booking access" on travel;

create policy "Travel follows booking access"
  on travel for select
  using (
    exists (
      select 1 from bookings b
      where b.id = travel.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- ─── payments: restrict to server-only mutations ──────────────────────────────
-- Service role bypasses RLS entirely, so these policies only gate client-side
-- requests. No client should ever insert or update payment records directly.
drop policy if exists "System can insert payments" on payments;
drop policy if exists "System can update payments" on payments;
drop policy if exists "Payments follow booking access" on payments;

create policy "Payments follow booking access"
  on payments for select
  using (
    exists (
      select 1 from bookings b
      where b.id = payments.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- No client-side inserts or updates on payments — server (service role) only.
create policy "No client inserts on payments"
  on payments for insert
  with check (false);

create policy "No client updates on payments"
  on payments for update
  using (false);

-- ─── transfers: same treatment ────────────────────────────────────────────────
drop policy if exists "System can insert transfers" on transfers;
drop policy if exists "System can update transfers" on transfers;
drop policy if exists "Transfers follow payment access" on transfers;

create policy "Transfers follow payment access"
  on transfers for select
  using (
    exists (
      select 1 from payments p
      join bookings b on b.id = p.booking_id
      where p.id = transfers.payment_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

create policy "No client inserts on transfers"
  on transfers for insert
  with check (false);

create policy "No client updates on transfers"
  on transfers for update
  using (false);

-- ─── deals table ─────────────────────────────────────────────────────────────
-- Stores the top-line financial agreement for a booking:
-- what the payer owes in total (gross), and the currency.
-- Per-artist fees and commission live in booking_artists.
-- Cost line items live in booking_costs.
-- This table is the single source of truth for "what does the invoice total?"
create table deals (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  gross_fee numeric(10,2) not null,        -- total the payer owes (performance fee, before costs)
  currency text not null default 'USD',
  -- fund release settings
  release_hours_after_gig integer not null default 4,  -- auto-release N hours after last set ends
  release_disputed boolean not null default false,      -- set true to pause auto-release
  release_disputed_at timestamptz,
  release_disputed_by uuid references profiles(id),
  released_at timestamptz,                -- when funds were actually released
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(booking_id)
);

create trigger set_deals_updated_at
  before update on deals
  for each row
  execute function update_updated_at();

alter table deals enable row level security;

create policy "Deal follows booking access"
  on deals for select
  using (
    exists (
      select 1 from bookings b
      where b.id = deals.booking_id
        and (
          b.created_by = auth.uid()
          or b.payer_user_id = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

create policy "Booking creator can manage deals"
  on deals for insert
  with check (
    exists (
      select 1 from bookings b
      where b.id = deals.booking_id
        and b.created_by = auth.uid()
    )
  );

create policy "Booking creator can update deals"
  on deals for update
  using (
    exists (
      select 1 from bookings b
      where b.id = deals.booking_id
        and b.created_by = auth.uid()
    )
  );

-- Booking creator OR DJs on the booking can flag a dispute (pause auto-release)
create policy "Booking participants can dispute release"
  on deals for update
  using (
    exists (
      select 1 from bookings b
      where b.id = deals.booking_id
        and (
          b.created_by = auth.uid()
          or exists (
            select 1 from booking_artists ba
            join dj_profiles dp on dp.id = ba.dj_profile_id
            where ba.booking_id = b.id
              and dp.user_id = auth.uid()
          )
        )
    )
  );

-- ─── guest access tokens ──────────────────────────────────────────────────────
-- Venues and promoters receive contracts/invoices via email. They don't
-- necessarily have accounts. This table issues short-lived signed tokens
-- that grant read (and limited action) access to a specific booking.
create table booking_access_tokens (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  token text not null unique,        -- random hex token included in email links
  email text not null,               -- who the token was sent to
  role text not null check (role in ('payer', 'viewer')),
  expires_at timestamptz not null,
  used_at timestamptz,               -- when first used (for audit)
  created_at timestamptz default now()
);

alter table booking_access_tokens enable row level security;

-- Tokens are read/issued server-side only via service role.
-- No client policies needed — the API validates the token and
-- uses service role to fetch booking data on their behalf.
create policy "No client access to tokens"
  on booking_access_tokens for all
  using (false);
