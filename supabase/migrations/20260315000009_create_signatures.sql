-- Create contract_signatures table
create table contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  signer_role text not null check (signer_role in ('agency', 'artist', 'payer')),
  signer_name text not null,
  signer_email text not null,
  signer_user_id uuid references profiles(id),
  signature_data text not null,
  signature_type text not null check (signature_type in ('drawn', 'typed')) default 'typed',
  ip_address text,
  user_agent text,
  signed_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table contract_signatures enable row level security;

-- Signatures follow contract access
create policy "Signatures follow contract access"
  on contract_signatures for select
  using (
    contract_id in (select id from contracts)
  );

-- Anyone with a signing token can insert (handled via API route)
create policy "Signing insert via service role"
  on contract_signatures for insert
  with check (true);

-- Add signing_token to contracts for guest signing links
alter table contracts add column signing_token uuid default gen_random_uuid();
create unique index contracts_signing_token_idx on contracts(signing_token);
