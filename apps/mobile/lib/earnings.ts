import { supabase } from "./supabase";

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

interface SummaryRow {
  total_earned: number | string;
  total_pending: number | string;
  total_upcoming: number | string;
  gig_count: number | string;
}

interface HistoryRow {
  id: string;
  date: string | null;
  event_name: string | null;
  venue_name: string | null;
  fee: number | string;
  commission_pct: number | string;
  commission: number | string;
  net: number | string;
  status: EarningsStatus;
}

export async function getEarningsSummary(): Promise<EarningsSummary> {
  const { data, error } = await supabase
    .rpc("get_earnings_summary")
    .single<SummaryRow>();

  if (error) throw new Error(error.message);

  return {
    totalEarned: Number(data.total_earned),
    totalPending: Number(data.total_pending),
    totalUpcoming: Number(data.total_upcoming),
    gigCount: Number(data.gig_count),
  };
}

export async function getEarningsHistory(): Promise<EarningsEntry[]> {
  const { data, error } = await supabase.rpc("get_earnings_history");

  if (error) throw new Error(error.message);

  return ((data as HistoryRow[]) ?? []).map((row) => ({
    id: row.id,
    date: row.date ?? "",
    eventName: row.event_name,
    venueName: row.venue_name,
    fee: Number(row.fee),
    commissionPct: Number(row.commission_pct),
    commission: Number(row.commission),
    net: Number(row.net),
    status: row.status,
  }));
}
