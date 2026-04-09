-- Add sort_order to agency_artists for roster reordering
ALTER TABLE agency_artists ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
