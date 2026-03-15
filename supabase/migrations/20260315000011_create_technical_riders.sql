-- Technical riders: per-DJ equipment and hospitality requirements
-- Versioned — each contract attaches the version at time of creation

create table technical_riders (
  id uuid primary key default gen_random_uuid(),
  dj_profile_id uuid not null references dj_profiles(id) on delete cascade,
  version integer not null default 1,
  equipment jsonb not null default '{}',
  booth_monitors text,
  booth_requirements text,
  power_requirements text,
  hospitality text,
  is_current boolean not null default true,
  created_at timestamptz default now()
);

-- Only one current rider per DJ
create unique index technical_riders_current_idx
  on technical_riders (dj_profile_id)
  where is_current = true;

-- Fast lookup by DJ profile
create index technical_riders_dj_profile_idx
  on technical_riders (dj_profile_id);

alter table technical_riders enable row level security;

-- DJs can read their own riders
create policy "DJs can view own riders"
  on technical_riders for select
  using (
    dj_profile_id in (
      select id from dj_profiles where user_id = auth.uid()
    )
  );

-- Anyone can read current riders (for contracts/public profiles)
create policy "Current riders are publicly readable"
  on technical_riders for select
  using (is_current = true);

-- DJs can insert their own riders
create policy "DJs can insert own riders"
  on technical_riders for insert
  with check (
    dj_profile_id in (
      select id from dj_profiles where user_id = auth.uid()
    )
  );

-- DJs can update their own riders (to set is_current = false)
create policy "DJs can update own riders"
  on technical_riders for update
  using (
    dj_profile_id in (
      select id from dj_profiles where user_id = auth.uid()
    )
  );
