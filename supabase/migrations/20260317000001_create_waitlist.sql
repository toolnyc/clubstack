create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('dj', 'promoter', 'agency', 'venue')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint waitlist_signups_email_key unique (email)
);

alter table waitlist_signups enable row level security;

-- Public inserts — no auth required
create policy "Public can join waitlist"
  on waitlist_signups for insert
  with check (true);

-- Auto-update updated_at
create trigger waitlist_signups_updated_at
  before update on waitlist_signups
  for each row execute function update_updated_at();
