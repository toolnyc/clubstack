import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";

/**
 * GET /api/roster — list active roster artists for the authenticated agency user.
 */
export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await supabase
    .from("agency_artists")
    .select(
      "*, dj_profile:dj_profiles(id, name, slug, location, rate_min, rate_max)"
    )
    .eq("agency_id", agency.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
