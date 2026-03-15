-- Create bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles(id),
  venue_id uuid references venues(id),
  promoter_id uuid references promoters(id),
  status text not null check (status in ('draft', 'contract_sent', 'signed', 'deposit_paid', 'balance_paid', 'completed', 'cancelled')) default 'draft',
  payer_type text check (payer_type in ('venue', 'promoter')),
  payer_user_id uuid references profiles(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_bookings_updated_at
  before update on bookings
  for each row
  execute function update_updated_at();

alter table bookings enable row level security;

-- Creator can do everything
create policy "Creator can read own bookings"
  on bookings for select
  using (created_by = auth.uid());

create policy "Creator can insert bookings"
  on bookings for insert
  with check (created_by = auth.uid());

create policy "Creator can update own bookings"
  on bookings for update
  using (created_by = auth.uid());

-- Payer can read their bookings
create policy "Payer can read bookings"
  on bookings for select
  using (payer_user_id = auth.uid());

-- DJs on the booking can read it
create policy "Booking artists can read bookings"
  on bookings for select
  using (
    id in (
      select ba.booking_id from booking_artists ba
      join dj_profiles dp on dp.id = ba.dj_profile_id
      where dp.user_id = auth.uid()
    )
  );

-- Create booking_dates
create table booking_dates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  date date not null,
  set_time time,
  load_in_time time,
  event_name text,
  created_at timestamptz default now()
);

alter table booking_dates enable row level security;

create policy "Booking dates follow booking access"
  on booking_dates for select
  using (
    booking_id in (select id from bookings)
  );

create policy "Creator can manage booking dates"
  on booking_dates for insert
  with check (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can update booking dates"
  on booking_dates for update
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can delete booking dates"
  on booking_dates for delete
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

-- Create booking_artists
create table booking_artists (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  dj_profile_id uuid not null references dj_profiles(id),
  fee numeric(10,2) not null,
  commission_pct numeric(5,2) default 15.00,
  payment_split_pct numeric(5,2) default 100.00,
  created_at timestamptz default now()
);

alter table booking_artists enable row level security;

create policy "Booking artists follow booking access"
  on booking_artists for select
  using (
    booking_id in (select id from bookings)
  );

create policy "Creator can manage booking artists"
  on booking_artists for insert
  with check (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can update booking artists"
  on booking_artists for update
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can delete booking artists"
  on booking_artists for delete
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

-- Create booking_costs
create table booking_costs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  category text check (category in ('travel', 'accommodation', 'equipment', 'other')),
  created_at timestamptz default now()
);

alter table booking_costs enable row level security;

create policy "Booking costs follow booking access"
  on booking_costs for select
  using (
    booking_id in (select id from bookings)
  );

create policy "Creator can manage booking costs"
  on booking_costs for insert
  with check (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can update booking costs"
  on booking_costs for update
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can delete booking costs"
  on booking_costs for delete
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );
