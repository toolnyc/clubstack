-- Create agencies table
create table agencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Updated_at trigger
create trigger set_agencies_updated_at
  before update on agencies
  for each row
  execute function update_updated_at();

-- RLS
alter table agencies enable row level security;

create policy "Users can read own agency"
  on agencies for select
  using (user_id = auth.uid());

create policy "Users can insert own agency"
  on agencies for insert
  with check (user_id = auth.uid());

create policy "Users can update own agency"
  on agencies for update
  using (user_id = auth.uid());

-- Create agency_artists junction table
create table agency_artists (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  dj_profile_id uuid not null references dj_profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'revoked')) default 'pending',
  commission_pct numeric(5,2) default 15.00,
  private_notes text,
  invited_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(agency_id, dj_profile_id)
);

-- Updated_at trigger
create trigger set_agency_artists_updated_at
  before update on agency_artists
  for each row
  execute function update_updated_at();

-- RLS
alter table agency_artists enable row level security;

-- Agency can see their own roster
create policy "Agency can read own roster"
  on agency_artists for select
  using (
    agency_id in (select id from agencies where user_id = auth.uid())
  );

-- DJ can see their own agency relationships
create policy "DJ can read own agency relationships"
  on agency_artists for select
  using (
    dj_profile_id in (select id from dj_profiles where user_id = auth.uid())
  );

-- Agency can invite artists
create policy "Agency can insert artists"
  on agency_artists for insert
  with check (
    agency_id in (select id from agencies where user_id = auth.uid())
  );

-- Agency can update their roster entries (notes, commission)
create policy "Agency can update own roster"
  on agency_artists for update
  using (
    agency_id in (select id from agencies where user_id = auth.uid())
  );

-- DJ can update their own status (approve/revoke)
create policy "DJ can update own agency status"
  on agency_artists for update
  using (
    dj_profile_id in (select id from dj_profiles where user_id = auth.uid())
  );

-- Agency can remove artists
create policy "Agency can delete own roster"
  on agency_artists for delete
  using (
    agency_id in (select id from agencies where user_id = auth.uid())
  );
