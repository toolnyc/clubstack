import type { Agency, RosterEntry } from "@clubstack/shared";

import { supabase } from "./supabase";

export async function getAgency(userId: string): Promise<Agency | null> {
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data as Agency | null;
}

export async function getRoster(agencyId: string): Promise<RosterEntry[]> {
  const { data, error } = await supabase
    .from("agency_artists")
    .select(
      "*, dj_profile:dj_profiles(id, name, slug, location, rate_min, rate_max)"
    )
    .eq("agency_id", agencyId)
    .neq("status", "revoked")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as RosterEntry[]) ?? [];
}

export async function getMyRoster(): Promise<RosterEntry[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const agency = await getAgency(session.user.id);
  if (!agency) return [];

  return getRoster(agency.id);
}

export async function inviteArtist(
  agencyId: string,
  email: string,
  commissionPct: number
): Promise<{ error: string | null }> {
  // Email-to-user lookup requires admin access (RPC get_user_id_by_email).
  // Mobile client calls a Next.js API route that performs the lookup server-side.
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { error: "Not authenticated" };

  const apiBase = process.env.EXPO_PUBLIC_API_URL;
  if (!apiBase) return { error: "API URL not configured" };

  const res = await fetch(`${apiBase}/api/agency/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      agency_id: agencyId,
      email,
      commission_pct: commissionPct,
    }),
  });

  const body = (await res.json()) as { error: string | null };
  return { error: body.error };
}

export async function updateArtist(
  id: string,
  updates: { commission_pct?: number; private_notes?: string }
): Promise<{ error: string | null }> {
  const updateData: Record<string, unknown> = {};
  if (updates.commission_pct !== undefined) {
    updateData.commission_pct = updates.commission_pct;
  }
  if (updates.private_notes !== undefined) {
    updateData.private_notes = updates.private_notes;
  }

  if (Object.keys(updateData).length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from("agency_artists")
    .update(updateData)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function removeArtist(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("agency_artists").delete().eq("id", id);

  return { error: error?.message ?? null };
}

export async function reorderRoster(
  agencyId: string,
  orderedIds: string[]
): Promise<void> {
  // Batch update sort_order for each artist
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("agency_artists")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("agency_id", agencyId)
  );

  await Promise.all(updates);
}
