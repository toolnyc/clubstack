"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getEarningsSummaryFromClient,
  getEarningsHistoryFromClient,
} from "./earnings-api";

export type {
  EarningsSummary,
  EarningsEntry,
  EarningsStatus,
} from "./earnings-api";

export interface EarningsFilters {
  startDate?: string;
  endDate?: string;
  status?: "completed" | "pending" | "upcoming" | "cancelled";
}

export interface AnnualSummary {
  year: number;
  totalEarned: number;
  totalCommission: number;
  netIncome: number;
  gigCount: number;
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getEarningsSummary() {
  const userId = await getAuthUserId();
  if (!userId) return { data: null, error: "Not authenticated" };
  const supabase = await createClient();
  return getEarningsSummaryFromClient(supabase, userId);
}

export async function getEarningsHistory(filters?: EarningsFilters) {
  const userId = await getAuthUserId();
  if (!userId) return { data: [], error: "Not authenticated" };
  const supabase = await createClient();
  const result = await getEarningsHistoryFromClient(supabase, userId);

  if (filters && result.data.length > 0) {
    result.data = result.data.filter((e) => {
      if (filters.startDate && e.date < filters.startDate) return false;
      if (filters.endDate && e.date > filters.endDate) return false;
      if (filters.status && e.status !== filters.status) return false;
      return true;
    });
  }

  return result;
}

export async function getAnnualSummary(
  year: number
): Promise<{ data: AnnualSummary | null; error: string | null }> {
  const { data: entries, error } = await getEarningsHistory({
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  });

  if (error) return { data: null, error };

  const completed = entries.filter((e) => e.status === "completed");

  return {
    data: {
      year,
      totalEarned:
        Math.round(completed.reduce((s, e) => s + e.fee, 0) * 100) / 100,
      totalCommission:
        Math.round(completed.reduce((s, e) => s + e.commission, 0) * 100) / 100,
      netIncome:
        Math.round(completed.reduce((s, e) => s + e.net, 0) * 100) / 100,
      gigCount: completed.length,
    },
    error: null,
  };
}
