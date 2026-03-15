"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getValidToken,
  fetchFreeBusy,
  isCacheFresh,
} from "@/lib/google/calendar";

export async function getCalendarConnection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("calendar_connections")
    .select("id, provider, calendar_id, created_at")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  return data;
}

export async function getAvailability(
  userId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();

  // Check cache first
  const { data: cached } = await supabase
    .from("calendar_cache")
    .select("date, status, cached_at")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  // If cache exists and is fresh, return it
  if (cached && cached.length > 0 && isCacheFresh(cached[0].cached_at)) {
    return cached.map((d) => ({ date: d.date, status: d.status }));
  }

  // Otherwise fetch from Google
  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!connection) {
    // No calendar connected — all dates are available
    return [];
  }

  try {
    const { access_token, refreshed, expires_at } =
      await getValidToken(connection);

    // Update token if refreshed
    if (refreshed) {
      await supabase
        .from("calendar_connections")
        .update({
          access_token,
          token_expires_at: expires_at.toISOString(),
        })
        .eq("id", connection.id);
    }

    const busyDays = await fetchFreeBusy(
      access_token,
      connection.calendar_id,
      new Date(startDate),
      new Date(endDate)
    );

    // Update cache
    if (busyDays.length > 0) {
      const cacheRows = busyDays.map((d) => ({
        user_id: userId,
        date: d.date,
        status: d.status,
        cached_at: new Date().toISOString(),
      }));

      await supabase.from("calendar_cache").upsert(cacheRows, {
        onConflict: "user_id,date",
      });
    }

    return busyDays;
  } catch {
    // On error, return stale cache if available
    if (cached) {
      return cached.map((d) => ({ date: d.date, status: d.status }));
    }
    return [];
  }
}
