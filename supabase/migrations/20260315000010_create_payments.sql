-- Add Stripe account fields to dj_profiles
alter table dj_profiles add column stripe_account_id text;
alter table dj_profiles add column stripe_account_status text
  check (stripe_account_status in ('pending', 'active', 'restricted'))
  default 'pending';

-- Add Stripe customer ID to profiles (for venue/promoter payers)
alter table profiles add column stripe_customer_id text;

-- Create payments table
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  stripe_payment_intent_id text,
  type text not null check (type in ('deposit', 'balance')),
  amount numeric(10,2) not null,
  status text not null check (status in ('pending', 'processing', 'succeeded', 'failed', 'refunded')) default 'pending',
  scheduled_date date,
  processed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_payments_updated_at
  before update on payments
  for each row
  execute function update_updated_at();

alter table payments enable row level security;

create policy "Payments follow booking access"
  on payments for select
  using (
    booking_id in (select id from bookings)
  );

create policy "System can insert payments"
  on payments for insert
  with check (true);

create policy "System can update payments"
  on payments for update
  using (true);

-- Create transfers table
create table transfers (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  stripe_transfer_id text,
  recipient_type text not null check (recipient_type in ('dj', 'agency')),
  recipient_stripe_account text not null,
  amount numeric(10,2) not null,
  status text not null check (status in ('pending', 'completed', 'failed')) default 'pending',
  created_at timestamptz default now()
);

alter table transfers enable row level security;

create policy "Transfers follow payment access"
  on transfers for select
  using (
    payment_id in (select id from payments)
  );

create policy "System can insert transfers"
  on transfers for insert
  with check (true);

create policy "System can update transfers"
  on transfers for update
  using (true);

-- Add deposit percentage to bookings
alter table bookings add column deposit_pct numeric(5,2) default 50.00;
alter table bookings add column balance_due_timing text
  check (balance_due_timing in ('day_before', 'week_before', 'day_of'))
  default 'day_of';
