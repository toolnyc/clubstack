import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const inviteSchema = z.object({
  agency_id: z.string().uuid(),
  email: z.string().email(),
  commission_pct: z.number().min(0).max(100).default(15),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verify the user owns this agency
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", parsed.data.agency_id)
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  // Look up DJ by email using the RPC
  const { data: targetUserId } = await supabase.rpc("get_user_id_by_email", {
    email_input: parsed.data.email,
  });

  if (!targetUserId) {
    return NextResponse.json(
      {
        error:
          "No DJ found with that email. They need to create a Clubstack account first.",
      },
      { status: 404 }
    );
  }

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", targetUserId)
    .single();

  if (!djProfile) {
    return NextResponse.json(
      {
        error:
          "That user doesn't have a DJ profile. They need to set one up first.",
      },
      { status: 404 }
    );
  }

  // Check if already on roster
  const { data: existing } = await supabase
    .from("agency_artists")
    .select("id, status")
    .eq("agency_id", agency.id)
    .eq("dj_profile_id", djProfile.id)
    .single();

  if (existing) {
    if (existing.status === "revoked") {
      const { error } = await supabase
        .from("agency_artists")
        .update({
          status: "pending",
          commission_pct: parsed.data.commission_pct,
        })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: null });
    }
    return NextResponse.json(
      { error: "This DJ is already on your roster" },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("agency_artists").insert({
    agency_id: agency.id,
    dj_profile_id: djProfile.id,
    status: "pending",
    commission_pct: parsed.data.commission_pct,
    invited_email: parsed.data.email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null });
}
