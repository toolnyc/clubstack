-- Contract signature audit log — additive migration.
-- The contract_signatures table already exists from 20260315000009.
-- This migration adds audit-specific columns and tightens RLS policies.

-- Add audit columns if they don't exist
ALTER TABLE contract_signatures
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS clause_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Replace permissive insert policy with server-only policy
DROP POLICY IF EXISTS "Signing insert via service role" ON contract_signatures;
DROP POLICY IF EXISTS "No client inserts on signatures" ON contract_signatures;
CREATE POLICY "No client inserts on signatures"
  ON contract_signatures FOR INSERT
  WITH CHECK (false);

-- Replace broad select policy with scoped one
DROP POLICY IF EXISTS "Signatures follow contract access" ON contract_signatures;
DROP POLICY IF EXISTS "Contract participants can read signatures" ON contract_signatures;
CREATE POLICY "Contract participants can read signatures"
  ON contract_signatures FOR SELECT
  USING (
    contract_id IN (
      SELECT c.id FROM contracts c
      JOIN bookings b ON b.id = c.booking_id
      WHERE
        b.created_by = auth.uid()
        OR b.payer_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM booking_artists ba
          JOIN dj_profiles dp ON dp.id = ba.dj_profile_id
          WHERE ba.booking_id = b.id
            AND dp.user_id = auth.uid()
        )
    )
  );

-- Index for quickly looking up all signatures on a contract
CREATE INDEX IF NOT EXISTS contract_signatures_contract_id_idx
  ON contract_signatures(contract_id);
