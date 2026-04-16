import type { SupabaseClient } from "@supabase/supabase-js";

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

async function getDjProfileIdForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data?.id ?? null;
}

export async function getEarningsSummaryFromClient(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: EarningsSummary | null; error: string | null }> {
  const djProfileId = await getDjProfileIdForUser(supabase, userId);
  if (!djProfileId) return { data: null, error: "Not authenticated as DJ" };

  const { data: entries, error } = await supabase
    .from("booking_artists")
    .select(
      `fee, commission_pct, booking:bookings!inner(id, status, payments(status))`
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

export async function getEarningsHistoryFromClient(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: EarningsEntry[]; error: string | null }> {
  const djProfileId = await getDjProfileIdForUser(supabase, userId);
  if (!djProfileId) return { data: [], error: "Not authenticated as DJ" };

  const { data: entries, error } = await supabase
    .from("booking_artists")
    .select(
      `id, fee, commission_pct, booking:bookings!inner(id, status, venue:venues(name), booking_dates(date, event_name), payments(status, processed_at))`
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

  result.sort((a, b) => b.date.localeCompare(a.date));
  return { data: result, error: null };
}
