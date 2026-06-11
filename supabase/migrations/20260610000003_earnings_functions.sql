-- Earnings aggregation in Postgres.
--
-- Replaces application-side aggregation that fetched every booking_artists
-- row and summed in JS. SECURITY DEFINER is safe here: results are scoped to
-- the caller via auth.uid(), and it lets the history include venue names,
-- which plain RLS hides from DJs.

CREATE OR REPLACE FUNCTION public.get_earnings_summary()
RETURNS TABLE (
  total_earned numeric,
  total_pending numeric,
  total_upcoming numeric,
  gig_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH entries AS (
    SELECT
      ba.fee::numeric AS fee,
      round(ba.fee::numeric * ba.commission_pct::numeric / 100.0, 2) AS commission,
      CASE
        WHEN b.status = 'cancelled' THEN 'cancelled'
        WHEN lp.status = 'succeeded' THEN 'completed'
        WHEN lp.status IN ('processing', 'pending') THEN 'pending'
        ELSE 'upcoming'
      END AS status
    FROM public.booking_artists ba
    JOIN public.dj_profiles dp ON dp.id = ba.dj_profile_id
    JOIN public.bookings b ON b.id = ba.booking_id
    LEFT JOIN LATERAL (
      SELECT p.status
      FROM public.payments p
      WHERE p.booking_id = b.id
      ORDER BY p.created_at DESC
      LIMIT 1
    ) lp ON true
    WHERE dp.user_id = auth.uid()
  )
  SELECT
    COALESCE(round(SUM(fee - commission) FILTER (WHERE status = 'completed'), 2), 0),
    COALESCE(round(SUM(fee - commission) FILTER (WHERE status = 'pending'), 2), 0),
    COALESCE(round(SUM(fee - commission) FILTER (WHERE status = 'upcoming'), 2), 0),
    COUNT(*)
  FROM entries;
$$;

CREATE OR REPLACE FUNCTION public.get_earnings_history()
RETURNS TABLE (
  id uuid,
  date date,
  event_name text,
  venue_name text,
  fee numeric,
  commission_pct numeric,
  commission numeric,
  net numeric,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ba.id,
    fd.date,
    fd.event_name,
    v.name AS venue_name,
    ba.fee::numeric,
    ba.commission_pct::numeric,
    round(ba.fee::numeric * ba.commission_pct::numeric / 100.0, 2) AS commission,
    round(ba.fee::numeric - round(ba.fee::numeric * ba.commission_pct::numeric / 100.0, 2), 2) AS net,
    CASE
      WHEN b.status = 'cancelled' THEN 'cancelled'
      WHEN lp.status = 'succeeded' THEN 'completed'
      WHEN lp.status IN ('processing', 'pending') THEN 'pending'
      ELSE 'upcoming'
    END AS status
  FROM public.booking_artists ba
  JOIN public.dj_profiles dp ON dp.id = ba.dj_profile_id
  JOIN public.bookings b ON b.id = ba.booking_id
  LEFT JOIN public.venues v ON v.id = b.venue_id
  LEFT JOIN LATERAL (
    SELECT bd.date, bd.event_name
    FROM public.booking_dates bd
    WHERE bd.booking_id = b.id
    ORDER BY bd.date ASC
    LIMIT 1
  ) fd ON true
  LEFT JOIN LATERAL (
    SELECT p.status
    FROM public.payments p
    WHERE p.booking_id = b.id
    ORDER BY p.created_at DESC
    LIMIT 1
  ) lp ON true
  WHERE dp.user_id = auth.uid()
  ORDER BY fd.date DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_earnings_summary() FROM public;
REVOKE ALL ON FUNCTION public.get_earnings_history() FROM public;
GRANT EXECUTE ON FUNCTION public.get_earnings_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_earnings_history() TO authenticated;
