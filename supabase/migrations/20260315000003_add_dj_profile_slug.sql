-- Add slug column to dj_profiles for public URLs
alter table dj_profiles add column slug text;

-- Generate slugs for existing profiles
update dj_profiles set slug = lower(replace(replace(name, ' ', '-'), '.', '')) where slug is null;

-- Make slug required and unique
alter table dj_profiles alter column slug set not null;
create unique index dj_profiles_slug_idx on dj_profiles(slug);

-- Allow unauthenticated (anon) users to view DJ profiles for public pages
create policy "Public can view DJ profiles"
  on dj_profiles for select
  using (true);
