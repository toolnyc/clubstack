-- Create threads table (one per booking)
create table threads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(booking_id)
);

alter table threads enable row level security;

-- Threads follow booking access (anyone who can see the booking can see the thread)
create policy "Threads follow booking access"
  on threads for select
  using (
    booking_id in (select id from bookings)
  );

-- Booking participants can create a thread
create policy "Booking participants can create threads"
  on threads for insert
  with check (
    booking_id in (select id from bookings)
  );

-- Create messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  is_system boolean default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Messages follow thread access (which follows booking access)
create policy "Messages follow thread access"
  on messages for select
  using (
    thread_id in (select id from threads)
  );

-- Authenticated users who can see the thread can send messages
create policy "Thread participants can send messages"
  on messages for insert
  with check (
    thread_id in (select id from threads)
    and (
      sender_id = auth.uid()
      or (sender_id is null and is_system = true)
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
