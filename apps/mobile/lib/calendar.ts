import { supabase } from "./supabase";

const apiBase = process.env.EXPO_PUBLIC_API_URL;

// ── Types ──

interface CalendarConnectionStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
}

interface DayStatus {
  date: string;
  status: "available" | "busy" | "blocked";
}

// ── Connection ──

export async function getConnectionStatus(): Promise<CalendarConnectionStatus> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      connected: false,
      lastSyncedAt: null,
      syncStatus: null,
      syncError: null,
    };

  const { data } = await supabase
    .from("calendar_connections")
    .select("last_synced_at, sync_status, sync_error")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  if (!data) {
    return {
      connected: false,
      lastSyncedAt: null,
      syncStatus: null,
      syncError: null,
    };
  }

  return {
    connected: true,
    lastSyncedAt: data.last_synced_at,
    syncStatus: data.sync_status,
    syncError: data.sync_error,
  };
}

export async function connectMobile(
  code: string,
  redirectUri: string
): Promise<{ error: string | null }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { error: "Not authenticated" };
  if (!apiBase) return { error: "API URL not configured" };

  const res = await fetch(`${apiBase}/api/calendar/connect-mobile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });

  const body = (await res.json()) as { error: string | null };
  return { error: body.error };
}

export async function disconnectCalendar(): Promise<{ error: string | null }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { error: "Not authenticated" };
  if (!apiBase) return { error: "API URL not configured" };

  const res = await fetch(`${apiBase}/api/calendar/disconnect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) return { error: "Failed to disconnect" };
  return { error: null };
}

// ── Availability ──

export async function getAvailability(
  startDate: string,
  endDate: string
): Promise<DayStatus[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch cached Google Calendar busy days
  const { data: cached } = await supabase
    .from("calendar_cache")
    .select("date, status")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate);

  // Fetch manual blocks
  const { data: manual } = await supabase
    .from("manual_availability")
    .select("specific_date, is_available")
    .eq("user_id", user.id)
    .not("specific_date", "is", null)
    .gte("specific_date", startDate)
    .lte("specific_date", endDate);

  // Build status map — manual blocks override cached status
  const statusMap = new Map<string, DayStatus>();

  for (const entry of cached ?? []) {
    if (entry.status === "busy") {
      statusMap.set(entry.date, { date: entry.date, status: "busy" });
    }
  }

  for (const entry of manual ?? []) {
    if (entry.specific_date && !entry.is_available) {
      statusMap.set(entry.specific_date, {
        date: entry.specific_date,
        status: "blocked",
      });
    }
  }

  return Array.from(statusMap.values());
}

// ── Manual Blocks ──

export async function blockDate(
  date: string
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("manual_availability").upsert(
    {
      user_id: user.id,
      specific_date: date,
      is_available: false,
    },
    { onConflict: "user_id,specific_date" }
  );

  return { error: error?.message ?? null };
}

export async function unblockDate(
  date: string
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("manual_availability")
    .delete()
    .eq("user_id", user.id)
    .eq("specific_date", date);

  return { error: error?.message ?? null };
}

export type { CalendarConnectionStatus, DayStatus };
