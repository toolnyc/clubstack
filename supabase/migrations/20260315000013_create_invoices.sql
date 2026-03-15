-- Create invoices table
create table invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  invoice_number text not null unique,
  total_amount numeric(10,2) not null,
  currency text default 'usd',
  status text not null check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')) default 'draft',
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_invoices_updated_at
  before update on invoices
  for each row
  execute function update_updated_at();

alter table invoices enable row level security;

create policy "Invoices follow booking access"
  on invoices for select
  using (
    booking_id in (select id from bookings)
  );

create policy "Booking creators can insert invoices"
  on invoices for insert
  with check (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

create policy "Booking creators can update invoices"
  on invoices for update
  using (
    booking_id in (select id from bookings where created_by = auth.uid())
  );

-- Create invoice line items table
create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  category text check (category in ('fee', 'travel', 'accommodation', 'equipment', 'other')),
  created_at timestamptz default now()
);

alter table invoice_line_items enable row level security;

create policy "Line items follow invoice access"
  on invoice_line_items for select
  using (
    invoice_id in (select id from invoices)
  );

create policy "Booking creators can insert line items"
  on invoice_line_items for insert
  with check (
    invoice_id in (
      select i.id from invoices i
      join bookings b on b.id = i.booking_id
      where b.created_by = auth.uid()
    )
  );

create policy "Booking creators can update line items"
  on invoice_line_items for update
  using (
    invoice_id in (
      select i.id from invoices i
      join bookings b on b.id = i.booking_id
      where b.created_by = auth.uid()
    )
  );
