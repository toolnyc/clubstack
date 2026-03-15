-- Create contracts table
create table contracts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  status text not null check (status in ('draft', 'sent', 'signed', 'voided')) default 'draft',
  signature_config text check (signature_config in ('agency_only', 'agency_and_artist')) default 'agency_only',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(booking_id)
);

create trigger set_contracts_updated_at
  before update on contracts
  for each row
  execute function update_updated_at();

alter table contracts enable row level security;

-- Contract follows booking access
create policy "Contract follows booking access"
  on contracts for select
  using (
    booking_id in (select id from bookings)
  );

create policy "Booking creator can manage contracts"
  on contracts for insert
  with check (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Booking creator can update contracts"
  on contracts for update
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

-- Create contract_clauses table
create table contract_clauses (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  clause_type text not null,
  title text not null,
  content text not null,
  is_enabled boolean default true,
  sort_order integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_contract_clauses_updated_at
  before update on contract_clauses
  for each row
  execute function update_updated_at();

alter table contract_clauses enable row level security;

create policy "Clauses follow contract access"
  on contract_clauses for select
  using (
    contract_id in (select id from contracts)
  );

create policy "Creator can manage clauses"
  on contract_clauses for insert
  with check (
    contract_id in (
      select c.id from contracts c
      join bookings b on b.id = c.booking_id
      where b.created_by = auth.uid()
    )
  );

create policy "Creator can update clauses"
  on contract_clauses for update
  using (
    contract_id in (
      select c.id from contracts c
      join bookings b on b.id = c.booking_id
      where b.created_by = auth.uid()
    )
  );

create policy "Creator can delete clauses"
  on contract_clauses for delete
  using (
    contract_id in (
      select c.id from contracts c
      join bookings b on b.id = c.booking_id
      where b.created_by = auth.uid()
    )
  );
