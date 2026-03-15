"use server";

import { createClient } from "@/lib/supabase/server";
import { getAvailability } from "@/lib/calendar/actions";
import type { RosterEntry, CalendarDay } from "@/types";

export interface ArtistAvailability {
  entry: RosterEntry;
  days: CalendarDay[];
}

export async function getRosterAvailability(
  startDate: string,
  endDate: string,
  feeMin?: number,
  feeMax?: number
): Promise<ArtistAvailability[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) return [];

  const query = supabase
    .from("agency_artists")
    .select(
      "*, dj_profile:dj_profiles(id, user_id, name, slug, location, rate_min, rate_max)"
    )
    .eq("agency_id", agency.id)
    .eq("status", "active");

  const { data: entries } = await query;
  if (!entries || entries.length === 0) return [];

  // Filter by fee range client-side (dj_profile is a join)
  let filtered = entries as (RosterEntry & {
    dj_profile: RosterEntry["dj_profile"] & { user_id: string };
  })[];

  if (feeMin !== undefined) {
    filtered = filtered.filter(
      (e) => e.dj_profile.rate_min === null || e.dj_profile.rate_min >= feeMin
    );
  }
  if (feeMax !== undefined) {
    filtered = filtered.filter(
      (e) => e.dj_profile.rate_max === null || e.dj_profile.rate_max <= feeMax
    );
  }

  // Fetch availability for each artist in parallel
  const results = await Promise.all(
    filtered.map(async (entry) => {
      const days = await getAvailability(
        entry.dj_profile.user_id,
        startDate,
        endDate
      );
      return { entry: entry as RosterEntry, days };
    })
  );

  return results;
}
