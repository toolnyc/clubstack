-- Compliance and KYC status tracking for DJs.
--
-- We do NOT store PII (DOB, address, SSN/EIN) in our database — those fields
-- are collected in-app and passed directly to Stripe via API, where Stripe
-- vaults them. We only store status flags that mirror what Stripe tells us
-- about verification state, plus our own W-9 completion tracking.

-- ─── dj_profiles: compliance status columns ──────────────────────────────────
alter table dj_profiles
  -- W-9 workflow tracking (our side)
  add column if not exists w9_status text
    check (w9_status in ('not_started', 'completed'))
    not null default 'not_started',
  add column if not exists w9_completed_at timestamptz,

  -- Whether the DJ has submitted a TIN (SSN/EIN) to Stripe
  add column if not exists stripe_tin_provided boolean not null default false,

  -- Mirrors Stripe's account.requirements.disabled_reason / verification status.
  -- Updated by our Stripe webhook handler on account.updated events.
  -- 'pending'         = account created, not yet submitted
  -- 'action_required' = Stripe needs more info (requirements.currently_due not empty)
  -- 'verified'        = payouts enabled
  -- 'restricted'      = Stripe has restricted the account
  add column if not exists stripe_kyc_status text
    check (stripe_kyc_status in ('pending', 'action_required', 'verified', 'restricted'))
    not null default 'pending',

  -- Raw requirements from Stripe (currently_due array) stored as JSON for display.
  -- Lets us show "what do you still need to provide?" without a live Stripe call.
  add column if not exists stripe_requirements jsonb;

-- Index for quickly finding DJs who need compliance action
-- (used by agency roster compliance view and payout cron)
create index if not exists dj_profiles_compliance_idx
  on dj_profiles(w9_status, stripe_kyc_status);

-- ─── compliance_task_status view ─────────────────────────────────────────────
-- Convenience view used by the dashboard "action needed" task list.
-- Shows each DJ's outstanding compliance steps in a flat, readable form.
create or replace view compliance_task_status as
select
  dp.id as dj_profile_id,
  dp.user_id,
  dp.display_name,
  dp.stripe_account_id,
  dp.w9_status,
  dp.w9_completed_at,
  dp.stripe_tin_provided,
  dp.stripe_kyc_status,
  dp.stripe_requirements,
  -- Derived: is this DJ blocked from receiving payouts?
  (
    dp.w9_status != 'completed'
    or not dp.stripe_tin_provided
    or dp.stripe_kyc_status not in ('verified')
  ) as payout_blocked,
  -- Derived: list of outstanding tasks as text array (for UI badges)
  array_remove(array[
    case when dp.w9_status != 'completed' then 'w9_required' end,
    case when not dp.stripe_tin_provided then 'tin_required' end,
    case when dp.stripe_kyc_status = 'action_required' then 'kyc_action_required' end,
    case when dp.stripe_kyc_status = 'restricted' then 'account_restricted' end
  ], null) as outstanding_tasks
from dj_profiles dp;

-- RLS on the underlying table covers access; no separate RLS needed on the view.
-- (Views in Supabase inherit RLS from their underlying tables.)
