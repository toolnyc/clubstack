"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Agency, RosterEntry, AgencyArtistStatus } from "@/types";

const agencySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  location: z.string().max(200).optional(),
});

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  commission_pct: z.number().min(0).max(100).default(15),
});

const updateArtistSchema = z.object({
  id: z.string().uuid(),
  commission_pct: z.number().min(0).max(100).optional(),
  private_notes: z.string().max(5000).optional(),
});

export async function getAgency(): Promise<Agency | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("agencies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function createAgency(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = agencySchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("agencies").insert({
    user_id: user.id,
    name: parsed.data.name,
    location: parsed.data.location ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updateAgency(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = agencySchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("agencies")
    .update({
      name: parsed.data.name,
      location: parsed.data.location ?? null,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getRoster(): Promise<RosterEntry[]> {
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

  const { data } = await supabase
    .from("agency_artists")
    .select(
      "*, dj_profile:dj_profiles(id, name, slug, location, rate_min, rate_max)"
    )
    .eq("agency_id", agency.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  return (data as RosterEntry[]) ?? [];
}

export async function inviteArtist(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    commission_pct: Number(formData.get("commission_pct") || 15),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Get the agency
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) return { error: "No agency found" };

  // Find the DJ profile by user email
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id")
    .eq(
      "id",
      (
        await supabase.rpc("get_user_id_by_email", {
          email_input: parsed.data.email,
        })
      ).data
    )
    .single();

  let djProfileId: string | null = null;

  if (targetUser) {
    const { data: djProfile } = await supabase
      .from("dj_profiles")
      .select("id")
      .eq("user_id", targetUser.id)
      .single();

    if (djProfile) {
      djProfileId = djProfile.id;
    }
  }

  if (!djProfileId) {
    // DJ not on platform yet — store invite with email for later matching
    // For MVP, we still need a dj_profile_id, so we return an error
    return {
      error:
        "No DJ found with that email. They need to create a Clubstack account first.",
    };
  }

  // Check if already on roster
  const { data: existing } = await supabase
    .from("agency_artists")
    .select("id, status")
    .eq("agency_id", agency.id)
    .eq("dj_profile_id", djProfileId)
    .single();

  if (existing) {
    if (existing.status === "revoked") {
      // Re-invite
      const { error } = await supabase
        .from("agency_artists")
        .update({
          status: "pending",
          commission_pct: parsed.data.commission_pct,
        })
        .eq("id", existing.id);

      if (error) return { error: error.message };
      return { error: null };
    }
    return { error: "This DJ is already on your roster" };
  }

  const { error } = await supabase.from("agency_artists").insert({
    agency_id: agency.id,
    dj_profile_id: djProfileId,
    status: "pending",
    commission_pct: parsed.data.commission_pct,
    invited_email: parsed.data.email,
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function updateArtist(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = updateArtistSchema.safeParse({
    id: formData.get("id"),
    commission_pct: formData.get("commission_pct")
      ? Number(formData.get("commission_pct"))
      : undefined,
    private_notes: formData.get("private_notes") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.commission_pct !== undefined) {
    updates.commission_pct = parsed.data.commission_pct;
  }
  if (parsed.data.private_notes !== undefined) {
    updates.private_notes = parsed.data.private_notes;
  }

  if (Object.keys(updates).length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from("agency_artists")
    .update(updates)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function removeArtist(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("agency_artists").delete().eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

// DJ-side actions

export async function getDJAgencyInvites() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!djProfile) return [];

  const { data } = await supabase
    .from("agency_artists")
    .select("*, agency:agencies(id, name, location)")
    .eq("dj_profile_id", djProfile.id)
    .eq("status", "pending");

  return data ?? [];
}

export async function respondToInvite(id: string, accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const newStatus: AgencyArtistStatus = accept ? "active" : "revoked";

  const { error } = await supabase
    .from("agency_artists")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function revokeAgencyAccess(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("agency_artists")
    .update({ status: "revoked" as AgencyArtistStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getDJAgencies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!djProfile) return [];

  const { data } = await supabase
    .from("agency_artists")
    .select("*, agency:agencies(id, name, location)")
    .eq("dj_profile_id", djProfile.id)
    .eq("status", "active");

  return data ?? [];
}

export async function importRosterCSV(csvText: string) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2)
    return { error: "CSV must have a header row and at least one data row" };

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  const emailIdx = header.indexOf("email");
  const commissionIdx = header.indexOf("commission");

  if (emailIdx === -1) return { error: "CSV must have an 'email' column" };

  const results: { email: string; result: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const email = cols[emailIdx];
    if (!email) continue;

    const commission = commissionIdx >= 0 ? Number(cols[commissionIdx]) : 15;

    const formData = new FormData();
    formData.set("email", email);
    formData.set("commission_pct", String(isNaN(commission) ? 15 : commission));

    const res = await inviteArtist(formData);
    results.push({ email, result: res.error ?? "invited" });
  }

  return { error: null, results };
}
