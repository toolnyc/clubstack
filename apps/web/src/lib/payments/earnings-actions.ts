"use server";

import { createClient } from "@/lib/supabase/server";

export type EarningsStatus = "completed" | "pending" | "upcoming" | "cancelled";

export interface EarningsSummary {
  totalEarned: number;
  totalPending: number;
  totalUpcoming: number;
  gigCount: number;
}

export interface EarningsEntry {
  id: string;
  date: string;
  eventName: string | null;
  venueName: string | null;
  fee: number;
  commissionPct: number;
  commission: number;
  net: number;
  status: EarningsStatus;
}

export interface EarningsFilters {
  startDate?: string;
  endDate?: string;
  status?: EarningsStatus;
}

export interface AnnualSummary {
  year: number;
  totalEarned: number;
  totalCommission: number;
  netIncome: number;
  gigCount: number;
}

/**
 * Get the current user's DJ profile ID.
 */
async function getDjProfileId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return data?.id ?? null;
}

/**
 * Map a booking status + payment status to an earnings display status.
 */
function resolveEarningsStatus(
  bookingStatus: string,
  paymentStatus: string | null
): EarningsStatus {
  if (bookingStatus === "cancelled") return "cancelled";
  if (paymentStatus === "succeeded") return "completed";
  if (paymentStatus === "processing" || paymentStatus === "pending")
    return "pending";
  return "upcoming";
}

/**
 * Fetch aggregated earnings summary for the current DJ user.
 */
export async function getEarningsSummary(): Promise<{
  data: EarningsSummary | null;
  error: string | null;
}> {
  const djProfileId = await getDjProfileId();
  if (!djProfileId) return { data: null, error: "Not authenticated as DJ" };

  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("booking_artists")
    .select(
      `
      fee,
      commission_pct,
      booking:bookings!inner(
        id,
        status,
        payments(status)
      )
    `
    )
    .eq("dj_profile_id", djProfileId);

  if (error) return { data: null, error: error.message };

  let totalEarned = 0;
  let totalPending = 0;
  let totalUpcoming = 0;
  let gigCount = 0;

  for (const entry of entries ?? []) {
    const booking = entry.booking as unknown as {
      id: string;
      status: string;
      payments: { status: string }[];
    };

    const latestPayment =
      booking.payments.length > 0
        ? booking.payments[booking.payments.length - 1]
        : null;

    const fee = Number(entry.fee);
    const commission =
      Math.round(fee * (Number(entry.commission_pct) / 100) * 100) / 100;
    const net = fee - commission;
    const status = resolveEarningsStatus(
      booking.status,
      latestPayment?.status ?? null
    );

    gigCount++;

    if (status === "completed") totalEarned += net;
    else if (status === "pending") totalPending += net;
    else if (status === "upcoming") totalUpcoming += net;
  }

  return {
    data: {
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalUpcoming: Math.round(totalUpcoming * 100) / 100,
      gigCount,
    },
    error: null,
  };
}

/**
 * Fetch per-gig earnings history for the current DJ user,
 * with optional date range and status filters.
 */
export async function getEarningsHistory(
  filters?: EarningsFilters
): Promise<{ data: EarningsEntry[]; error: string | null }> {
  const djProfileId = await getDjProfileId();
  if (!djProfileId) return { data: [], error: "Not authenticated as DJ" };

  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("booking_artists")
    .select(
      `
      id,
      fee,
      commission_pct,
      booking:bookings!inner(
        id,
        status,
        venue:venues(name),
        booking_dates(date, event_name),
        payments(status, processed_at)
      )
    `
    )
    .eq("dj_profile_id", djProfileId);

  if (error) return { data: [], error: error.message };

  const result: EarningsEntry[] = [];

  for (const entry of entries ?? []) {
    const booking = entry.booking as unknown as {
      id: string;
      status: string;
      venue: { name: string } | null;
      booking_dates: { date: string; event_name: string | null }[];
      payments: { status: string; processed_at: string | null }[];
    };

    const firstDate = booking.booking_dates[0];
    const date = firstDate?.date ?? "";
    const eventName = firstDate?.event_name ?? null;
    const venueName = booking.venue?.name ?? null;

    const latestPayment =
      booking.payments.length > 0
        ? booking.payments[booking.payments.length - 1]
        : null;

    const fee = Number(entry.fee);
    const commissionPct = Number(entry.commission_pct);
    const commission = Math.round(fee * (commissionPct / 100) * 100) / 100;
    const net = Math.round((fee - commission) * 100) / 100;
    const status = resolveEarningsStatus(
      booking.status,
      latestPayment?.status ?? null
    );

    // Apply filters
    if (filters?.startDate && date < filters.startDate) continue;
    if (filters?.endDate && date > filters.endDate) continue;
    if (filters?.status && status !== filters.status) continue;

    result.push({
      id: entry.id as string,
      date,
      eventName,
      venueName,
      fee,
      commissionPct,
      commission,
      net,
      status,
    });
  }

  // Sort by date descending
  result.sort((a, b) => b.date.localeCompare(a.date));

  return { data: result, error: null };
}

/**
 * Fetch annual summary for tax purposes.
 */
export async function getAnnualSummary(
  year: number
): Promise<{ data: AnnualSummary | null; error: string | null }> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data: entries, error } = await getEarningsHistory({
    startDate,
    endDate,
  });

  if (error) return { data: null, error };

  // Only count completed gigs for tax summary
  const completed = entries.filter((e) => e.status === "completed");

  const totalEarned = completed.reduce((sum, e) => sum + e.fee, 0);
  const totalCommission = completed.reduce((sum, e) => sum + e.commission, 0);
  const netIncome = completed.reduce((sum, e) => sum + e.net, 0);

  return {
    data: {
      year,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      gigCount: completed.length,
    },
    error: null,
  };
}
