-- Notification preferences per user per type
create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  notification_type text not null,
  email_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, notification_type)
);

-- Fast lookups by user
create index notification_preferences_user_id_idx
  on notification_preferences(user_id);

-- Enable RLS
alter table notification_preferences enable row level security;

-- Owner can manage own preferences
create policy "Users can select own notification preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own notification preferences"
  on notification_preferences for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create trigger notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function update_updated_at();
