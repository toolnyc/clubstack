-- Clubstack test seed data
-- Well-known UUIDs for deterministic test fixtures
-- Used by local Supabase (supabase start) for development and testing

-- =============================================================================
-- Test Users (auth.users)
-- =============================================================================
-- Local Supabase uses a special schema for auth. We insert directly.

-- The empty-string token columns are required: GoTrue fails password logins
-- with "Database error querying schema" when they are NULL.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
VALUES
  -- DJ user
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'dj@test.local', extensions.crypt('testpass123', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated',
   '', '', '', '', '', '', '', ''),
  -- Agency user
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'agency@test.local', extensions.crypt('testpass123', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated',
   '', '', '', '', '', '', '', ''),
  -- Promoter user
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'promoter@test.local', extensions.crypt('testpass123', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated',
   '', '', '', '', '', '', '', ''),
  -- Venue contact user
  ('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'venue@test.local', extensions.crypt('testpass123', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated',
   '', '', '', '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- GoTrue expects an email identity per user for password sign-in.
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  u.id, u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  now(), now(), now()
FROM auth.users u
WHERE u.email LIKE '%@test.local'
ON CONFLICT (provider_id, provider) DO NOTHING;

-- =============================================================================
-- Profiles
-- =============================================================================

INSERT INTO public.profiles (id, user_type, display_name, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'dj', 'Test DJ', now(), now()),
  ('a2222222-2222-2222-2222-222222222222', 'agency', 'Test Agency User', now(), now()),
  ('a3333333-3333-3333-3333-333333333333', 'promoter', 'Test Promoter User', now(), now()),
  ('a4444444-4444-4444-4444-444444444444', 'venue_contact', 'Test Venue Contact', now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DJ Profile
-- =============================================================================

INSERT INTO public.dj_profiles (id, user_id, name, slug, rate_min, rate_max, location, bio, created_at, updated_at)
VALUES
  ('b1111111-1111-1111-1111-111111111111',
   'a1111111-1111-1111-1111-111111111111',
   'DJ Testwave', 'dj-testwave',
   500, 2000, 'Brooklyn, NY',
   'Test DJ for local development.',
   now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Agency
-- =============================================================================

INSERT INTO public.agencies (id, user_id, name, location, created_at, updated_at)
VALUES
  ('c1111111-1111-1111-1111-111111111111',
   'a2222222-2222-2222-2222-222222222222',
   'Test Agency', 'New York, NY',
   now(), now())
ON CONFLICT (id) DO NOTHING;

-- Agency roster: DJ Testwave is on the agency roster
INSERT INTO public.agency_artists (id, agency_id, dj_profile_id, status, commission_pct, created_at, updated_at)
VALUES
  ('d1111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   'b1111111-1111-1111-1111-111111111111',
   'active', 15.00,
   now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Promoter
-- =============================================================================

INSERT INTO public.promoters (id, user_id, name, location, created_at, updated_at)
VALUES
  ('e1111111-1111-1111-1111-111111111111',
   'a3333333-3333-3333-3333-333333333333',
   'Test Promoter', 'Manhattan, NY',
   now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Venue + Contact
-- =============================================================================

INSERT INTO public.venues (id, name, location, address, capacity, created_at, updated_at)
VALUES
  ('f1111111-1111-1111-1111-111111111111',
   'The Test Club', 'Lower East Side, NY',
   '123 Test St, New York, NY 10002', 300,
   now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.venue_contacts (id, venue_id, user_id, is_primary, created_at)
VALUES
  ('f2222222-2222-2222-2222-222222222222',
   'f1111111-1111-1111-1111-111111111111',
   'a4444444-4444-4444-4444-444444444444',
   true, now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Draft Booking (agency books DJ Testwave at The Test Club for promoter)
-- =============================================================================

INSERT INTO public.bookings (id, created_by, venue_id, promoter_id, status, payer_type, payer_user_id, deposit_pct, notes, created_at, updated_at)
VALUES
  ('11111111-aaaa-bbbb-cccc-111111111111',
   'a2222222-2222-2222-2222-222222222222',
   'f1111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   'draft', 'promoter',
   'a3333333-3333-3333-3333-333333333333',
   50.00, 'Test booking for development',
   now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_dates (id, booking_id, date, set_time, end_time, event_name, created_at)
VALUES
  ('11111111-dddd-eeee-ffff-111111111111',
   '11111111-aaaa-bbbb-cccc-111111111111',
   (CURRENT_DATE + INTERVAL '30 days')::date,
   '23:00', '02:00', 'Test Night',
   now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_artists (id, booking_id, dj_profile_id, fee, commission_pct, created_at)
VALUES
  ('11111111-1111-2222-3333-111111111111',
   '11111111-aaaa-bbbb-cccc-111111111111',
   'b1111111-1111-1111-1111-111111111111',
   1500.00, 15.00,
   now())
ON CONFLICT (id) DO NOTHING;

-- Deal for the booking
INSERT INTO public.deals (id, booking_id, gross_fee, currency, created_at, updated_at)
VALUES
  ('11111111-4444-5555-6666-111111111111',
   '11111111-aaaa-bbbb-cccc-111111111111',
   1500.00, 'USD',
   now(), now())
ON CONFLICT (id) DO NOTHING;

-- Thread for booking messages
INSERT INTO public.threads (id, booking_id, created_at)
VALUES
  ('11111111-7777-8888-9999-111111111111',
   '11111111-aaaa-bbbb-cccc-111111111111',
   now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Waitlist signup (public, no auth needed)
-- =============================================================================

INSERT INTO public.waitlist_signups (id, email, role, name, created_at, updated_at)
VALUES
  ('22222222-1111-1111-1111-111111111111',
   'waitlist@test.local', 'dj', 'Waitlist Tester',
   now(), now())
ON CONFLICT (id) DO NOTHING;
