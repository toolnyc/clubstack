-- Contract signature audit log.
--
-- Each row is an immutable record of one signing action. This is the legal
-- evidence that a specific person (identified by email + OTP token) agreed to
-- a specific contract at a specific time from a specific IP address.
--
-- Rows are NEVER updated or deleted. The service role inserts them; no client
-- policy allows mutations.

create table contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id),

  -- Who signed
  signer_email text not null,
  signer_role text not null check (signer_role in ('agency', 'artist', 'payer')),

  -- If the signer has an account, link them. Null for guest payers.
  signer_user_id uuid references profiles(id),

  -- The OTP token that was redeemed to complete this signature.
  -- Store a hash (sha256), not the raw token, so a DB leak can't replay it.
  token_hash text not null,

  -- Audit trail fields — required for ESIGN Act compliance
  signed_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,

  -- Snapshot of what was signed. Stores the contract clause IDs and their
  -- content hashes at signing time, so we can prove the signed content
  -- hasn't changed even if clauses are later edited on other contracts.
  clause_snapshot jsonb not null default '[]'::jsonb,

  created_at timestamptz default now()
);

-- No updates or deletes — this is an append-only audit table
alter table contract_signatures enable row level security;

-- Booking creator and DJs on the booking can read signatures for their contracts
create policy "Contract participants can read signatures"
  on contract_signatures for select
  using (
    contract_id in (
      select c.id from contracts c
      join bookings b on b.id = c.booking_id
      where
        b.created_by = auth.uid()
        or b.payer_user_id = auth.uid()
        or exists (
          select 1 from booking_artists ba
          join dj_profiles dp on dp.id = ba.dj_profile_id
          where ba.booking_id = b.id
            and dp.user_id = auth.uid()
        )
    )
  );

-- No client inserts or updates — server (service role) only
create policy "No client inserts on signatures"
  on contract_signatures for insert
  with check (false);

-- Index for quickly looking up all signatures on a contract
create index contract_signatures_contract_id_idx
  on contract_signatures(contract_id);
