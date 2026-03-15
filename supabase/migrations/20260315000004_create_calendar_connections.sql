-- Calendar connections for Google Calendar OAuth
create table calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  calendar_id text not null default 'primary',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One connection per user per provider
create unique index calendar_connections_user_provider_idx
  on calendar_connections(user_id, provider);

-- Enable RLS
alter table calendar_connections enable row level security;

-- Only owner can access their connection
create policy "Users can manage own calendar connections"
  on calendar_connections for all
  using (auth.uid() = user_id);

-- Auto-update updated_at
create trigger calendar_connections_updated_at
  before update on calendar_connections
  for each row execute function update_updated_at();

-- Cached free/busy data
create table calendar_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  status text not null check (status in ('available', 'busy')),
  cached_at timestamptz default now()
);

create unique index calendar_cache_user_date_idx
  on calendar_cache(user_id, date);

alter table calendar_cache enable row level security;

create policy "Users can manage own calendar cache"
  on calendar_cache for all
  using (auth.uid() = user_id);

-- Anyone authenticated can read calendar cache (for availability views)
create policy "Authenticated users can view calendar cache"
  on calendar_cache for select
  using (auth.role() = 'authenticated');
