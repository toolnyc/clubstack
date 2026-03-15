-- Manual availability for DJs who don't use Google Calendar
create table manual_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  specific_date date,
  is_available boolean not null default true,
  start_time time,
  end_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Must specify either day_of_week (recurring) or specific_date (one-off), not both
alter table manual_availability
  add constraint manual_availability_day_or_date_check
  check (
    (day_of_week is not null and specific_date is null)
    or (day_of_week is null and specific_date is not null)
  );

-- Fast lookups by user
create index manual_availability_user_id_idx
  on manual_availability(user_id);

-- Enable RLS
alter table manual_availability enable row level security;

-- Owner can do everything with own rows
create policy "Users can select own manual availability"
  on manual_availability for select
  using (auth.uid() = user_id);

create policy "Users can insert own manual availability"
  on manual_availability for insert
  with check (auth.uid() = user_id);

create policy "Users can update own manual availability"
  on manual_availability for update
  using (auth.uid() = user_id);

create policy "Users can delete own manual availability"
  on manual_availability for delete
  using (auth.uid() = user_id);

-- Authenticated users can read availability (for public profiles)
create policy "Authenticated users can view manual availability"
  on manual_availability for select
  using (auth.role() = 'authenticated');

-- Auto-update updated_at
create trigger manual_availability_updated_at
  before update on manual_availability
  for each row execute function update_updated_at();
