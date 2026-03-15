-- Create booking_travel table for tracking travel attached to bookings
create table booking_travel (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  type text not null check (type in ('flight', 'hotel', 'ground_transport')),
  -- Flight fields
  airline text,
  flight_number text,
  departure_airport text,
  arrival_airport text,
  departure_time timestamptz,
  arrival_time timestamptz,
  -- Hotel fields
  hotel_name text,
  hotel_address text,
  check_in date,
  check_out date,
  -- Ground transport
  transport_details text,
  -- Common
  notes text,
  cost numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_booking_travel_updated_at
  before update on booking_travel
  for each row
  execute function update_updated_at();

alter table booking_travel enable row level security;

-- Read access follows booking access (leverages existing booking RLS policies)
create policy "Booking travel follows booking access"
  on booking_travel for select
  using (
    booking_id in (select id from bookings)
  );

-- Creator of the booking can manage travel records
create policy "Creator can insert booking travel"
  on booking_travel for insert
  with check (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can update booking travel"
  on booking_travel for update
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Creator can delete booking travel"
  on booking_travel for delete
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );
