-- DJ profiles table
create table dj_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  bio text,
  genres text[] not null default '{}',
  location text,
  photo_url text,
  soundcloud_url text,
  instagram_url text,
  website_url text,
  rate_min integer,
  rate_max integer,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'),
  constraint rate_range check (
    (rate_min is null or rate_min >= 0) and
    (rate_max is null or rate_max >= 0) and
    (rate_min is null or rate_max is null or rate_min <= rate_max)
  ), -- Allows one rate to be null while the other is set, ensures non-negative rates
  constraint unique_user_profile unique (user_id)
);

-- Indexes
create index idx_dj_profiles_slug on dj_profiles (slug);
create index idx_dj_profiles_genres on dj_profiles using gin (genres);
create index idx_dj_profiles_published on dj_profiles (is_published) where is_published = true;
create index idx_dj_profiles_user_id on dj_profiles (user_id);

-- RLS
alter table dj_profiles enable row level security;

-- Anyone can read published profiles
create policy "Published profiles are viewable by everyone"
  on dj_profiles for select
  using (is_published = true);

-- Authenticated users can read their own profile (even if unpublished)
create policy "Users can view own profile"
  on dj_profiles for select
  using (auth.uid() = user_id);

-- Users can insert their own profile
create policy "Users can create own profile"
  on dj_profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update own profile"
  on dj_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own profile
create policy "Users can delete own profile"
  on dj_profiles for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on dj_profiles
  for each row execute function update_updated_at();
