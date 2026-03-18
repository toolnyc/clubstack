-- Add optional name field to waitlist_signups.
-- Collected via the landing page waitlist form; used for email personalization.
alter table waitlist_signups
  add column if not exists name text;

comment on column waitlist_signups.name is 'Optional display name provided at signup, used to personalize the confirmation email.';
