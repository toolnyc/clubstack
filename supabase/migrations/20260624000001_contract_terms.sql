-- Structured contract terms (fee lines + generic payees) and the frozen
-- terms snapshot.
--
-- The Contract carries money terms as structured, generic payee data: each fee
-- line distributes to one or more payees = { recipient, entitlement, priority,
-- role label }. "Performer"/"commission" are labels on payee rows, not types.
-- At the Signed transition these are frozen into contracts.terms_snapshot.
--
-- Additive only: payment_split_pct / deal-math are untouched here and torn out
-- in a follow-up once invoice derivation consumes this structure.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS terms_snapshot jsonb;

CREATE TABLE IF NOT EXISTS public.contract_fee_lines (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contract_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT contract_fee_lines_pkey PRIMARY KEY (id),
  CONSTRAINT contract_fee_lines_amount_check CHECK (amount >= 0),
  CONSTRAINT contract_fee_lines_contract_id_fkey
    FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.contract_fee_line_payees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  fee_line_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL,
  role_label text NOT NULL,
  entitlement_kind text NOT NULL,
  entitlement_value numeric(10, 2) NOT NULL,
  priority integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT contract_fee_line_payees_pkey PRIMARY KEY (id),
  CONSTRAINT contract_fee_line_payees_entitlement_kind_check
    CHECK (entitlement_kind = ANY (ARRAY['fixed'::text, 'pct'::text])),
  CONSTRAINT contract_fee_line_payees_entitlement_value_check
    CHECK (entitlement_value >= 0),
  CONSTRAINT contract_fee_line_payees_fee_line_id_fkey
    FOREIGN KEY (fee_line_id) REFERENCES public.contract_fee_lines (id) ON DELETE CASCADE,
  CONSTRAINT contract_fee_line_payees_recipient_user_id_fkey
    FOREIGN KEY (recipient_user_id) REFERENCES public.profiles (id)
);

CREATE INDEX IF NOT EXISTS contract_fee_lines_contract_id_idx
  ON public.contract_fee_lines USING btree (contract_id);

CREATE INDEX IF NOT EXISTS contract_fee_line_payees_fee_line_id_idx
  ON public.contract_fee_line_payees USING btree (fee_line_id);

-- Access predicates scoped through contract -> booking. SECURITY DEFINER so the
-- child-table policies make one call instead of re-deriving booking access.
CREATE OR REPLACE FUNCTION public.has_contract_access(p_contract_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.id = p_contract_id
      AND public.has_booking_access(c.booking_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_contract_owner(p_contract_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contracts c
    JOIN public.bookings b ON b.id = c.booking_id
    WHERE c.id = p_contract_id
      AND b.created_by = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.has_contract_access(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_contract_owner(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.has_contract_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_contract_owner(uuid) TO authenticated;

ALTER TABLE public.contract_fee_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_fee_line_payees ENABLE ROW LEVEL SECURITY;

-- Fee lines: readable by anyone with booking access; writable by the booking creator.
DROP POLICY IF EXISTS "Fee lines follow contract access" ON public.contract_fee_lines;
CREATE POLICY "Fee lines follow contract access" ON public.contract_fee_lines
  FOR SELECT USING (public.has_contract_access(contract_id));

DROP POLICY IF EXISTS "Booking creator can manage fee lines" ON public.contract_fee_lines;
CREATE POLICY "Booking creator can manage fee lines" ON public.contract_fee_lines
  FOR ALL USING (public.is_contract_owner(contract_id))
  WITH CHECK (public.is_contract_owner(contract_id));

-- Payees: scoped through their fee line's contract.
DROP POLICY IF EXISTS "Payees follow contract access" ON public.contract_fee_line_payees;
CREATE POLICY "Payees follow contract access" ON public.contract_fee_line_payees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contract_fee_lines fl
      WHERE fl.id = fee_line_id AND public.has_contract_access(fl.contract_id)
    )
  );

DROP POLICY IF EXISTS "Booking creator can manage payees" ON public.contract_fee_line_payees;
CREATE POLICY "Booking creator can manage payees" ON public.contract_fee_line_payees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contract_fee_lines fl
      WHERE fl.id = fee_line_id AND public.is_contract_owner(fl.contract_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contract_fee_lines fl
      WHERE fl.id = fee_line_id AND public.is_contract_owner(fl.contract_id)
    )
  );
