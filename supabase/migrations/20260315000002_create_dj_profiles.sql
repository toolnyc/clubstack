-- DJ profiles
create table dj_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  rate_min numeric(10,2),
  rate_max numeric(10,2),
  soundcloud_url text,
  instagram_url text,
  location text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One profile per user
create unique index dj_profiles_user_id_idx on dj_profiles(user_id);

-- Enable RLS
alter table dj_profiles enable row level security;

-- Owner can do everything
create policy "Owner can manage own DJ profile"
  on dj_profiles for all
  using (auth.uid() = user_id);

-- Any authenticated user can view DJ profiles
create policy "Authenticated users can view DJ profiles"
  on dj_profiles for select
  using (auth.role() = 'authenticated');

-- Auto-update updated_at
create trigger dj_profiles_updated_at
  before update on dj_profiles
  for each row execute function update_updated_at();
