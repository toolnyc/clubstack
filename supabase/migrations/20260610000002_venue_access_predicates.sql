-- Venue access predicates.
--
-- "Venue members can read co-contacts" on venue_contacts queried
-- venue_contacts itself, so any query that touched venue RLS (for example the
-- invoices list joining venues) failed with "infinite recursion detected in
-- policy". The SECURITY DEFINER predicates evaluate without RLS.

CREATE OR REPLACE FUNCTION public.is_venue_member(p_venue_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.venue_contacts vc
    WHERE vc.venue_id = p_venue_id
      AND vc.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_venue_primary_contact(p_venue_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.venue_contacts vc
    WHERE vc.venue_id = p_venue_id
      AND vc.user_id = auth.uid()
      AND vc.is_primary = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_venue_member(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_venue_primary_contact(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_venue_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_venue_primary_contact(uuid) TO authenticated;

DROP POLICY IF EXISTS "Venue members can read co-contacts" ON public.venue_contacts;
CREATE POLICY "Venue members can read co-contacts" ON public.venue_contacts
  FOR SELECT USING (public.is_venue_member(venue_id));

DROP POLICY IF EXISTS "Venue primary contact can delete contacts" ON public.venue_contacts;
CREATE POLICY "Venue primary contact can delete contacts" ON public.venue_contacts
  FOR DELETE USING (public.is_venue_primary_contact(venue_id));

DROP POLICY IF EXISTS "Venue contacts can read own venue" ON public.venues;
CREATE POLICY "Venue contacts can read own venue" ON public.venues
  FOR SELECT USING (public.is_venue_member(id));

DROP POLICY IF EXISTS "Venue contacts can update own venue" ON public.venues;
CREATE POLICY "Venue contacts can update own venue" ON public.venues
  FOR UPDATE USING (public.is_venue_member(id));
