-- Create venues table
create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  address text,
  capacity integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_venues_updated_at
  before update on venues
  for each row
  execute function update_updated_at();

alter table venues enable row level security;

-- Create venue_contacts junction
create table venue_contacts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique(venue_id, user_id)
);

alter table venue_contacts enable row level security;

-- Venue contacts can read their venue
create policy "Venue contacts can read own venue"
  on venues for select
  using (
    id in (select venue_id from venue_contacts where user_id = auth.uid())
  );

-- Venue contacts can update their venue
create policy "Venue contacts can update own venue"
  on venues for update
  using (
    id in (select venue_id from venue_contacts where user_id = auth.uid())
  );

-- Venue contacts can insert venues
create policy "Authenticated users can create venues"
  on venues for insert
  with check (true);

-- Venue contacts RLS
create policy "Users can read own venue contacts"
  on venue_contacts for select
  using (user_id = auth.uid());

create policy "Venue members can read co-contacts"
  on venue_contacts for select
  using (
    venue_id in (select venue_id from venue_contacts where user_id = auth.uid())
  );

create policy "Venue primary contact can insert contacts"
  on venue_contacts for insert
  with check (true);

create policy "Venue primary contact can delete contacts"
  on venue_contacts for delete
  using (
    venue_id in (
      select venue_id from venue_contacts
      where user_id = auth.uid() and is_primary = true
    )
  );

-- Create promoters table
create table promoters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create trigger set_promoters_updated_at
  before update on promoters
  for each row
  execute function update_updated_at();

alter table promoters enable row level security;

create policy "Users can read own promoter"
  on promoters for select
  using (user_id = auth.uid());

create policy "Users can insert own promoter"
  on promoters for insert
  with check (user_id = auth.uid());

create policy "Users can update own promoter"
  on promoters for update
  using (user_id = auth.uid());
