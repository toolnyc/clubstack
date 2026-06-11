-- Booking access predicates.
--
-- The SELECT policy on bookings referenced booking_artists while the SELECT
-- policy on booking_artists referenced bookings, which Postgres rejects with
-- "infinite recursion detected in policy" for any non-creator query. The
-- SECURITY DEFINER predicates below evaluate without RLS, breaking the cycle,
-- and become the single definition of who can see a Booking.

CREATE OR REPLACE FUNCTION public.is_booking_artist(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booking_artists ba
    JOIN public.dj_profiles dp ON dp.id = ba.dj_profile_id
    WHERE ba.booking_id = p_booking_id
      AND dp.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_booking_access(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = p_booking_id
      AND (
        b.created_by = auth.uid()
        OR b.payer_user_id = auth.uid()
        OR public.is_booking_artist(b.id)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_booking_artist(uuid) FROM public;
REVOKE ALL ON FUNCTION public.has_booking_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_booking_artist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_booking_access(uuid) TO authenticated;

-- bookings: artist read access via the definer predicate (no recursion).
DROP POLICY IF EXISTS "Booking artists can read bookings" ON public.bookings;
CREATE POLICY "Booking artists can read bookings" ON public.bookings
  FOR SELECT USING (public.is_booking_artist(id));

-- Child tables: one predicate call instead of hand-copied subqueries.
DROP POLICY IF EXISTS "Booking artists follow booking access" ON public.booking_artists;
CREATE POLICY "Booking artists follow booking access" ON public.booking_artists
  FOR SELECT USING (public.has_booking_access(booking_id));

DROP POLICY IF EXISTS "Booking costs follow booking access" ON public.booking_costs;
CREATE POLICY "Booking costs follow booking access" ON public.booking_costs
  FOR SELECT USING (public.has_booking_access(booking_id));

DROP POLICY IF EXISTS "Booking dates follow booking access" ON public.booking_dates;
CREATE POLICY "Booking dates follow booking access" ON public.booking_dates
  FOR SELECT USING (public.has_booking_access(booking_id));

DROP POLICY IF EXISTS "Booking travel follows booking access" ON public.booking_travel;
DROP POLICY IF EXISTS "Travel follows booking access" ON public.booking_travel;
CREATE POLICY "Booking travel follows booking access" ON public.booking_travel
  FOR SELECT USING (public.has_booking_access(booking_id));

DROP POLICY IF EXISTS "Invoices follow booking access" ON public.invoices;
CREATE POLICY "Invoices follow booking access" ON public.invoices
  FOR SELECT USING (public.has_booking_access(booking_id));

DROP POLICY IF EXISTS "Payments follow booking access" ON public.payments;
CREATE POLICY "Payments follow booking access" ON public.payments
  FOR SELECT USING (public.has_booking_access(booking_id));

DROP POLICY IF EXISTS "Threads follow booking access" ON public.threads;
CREATE POLICY "Threads follow booking access" ON public.threads
  FOR SELECT USING (public.has_booking_access(booking_id));
