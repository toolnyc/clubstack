import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";

/**
 * GET /api/bookings/[id] — get booking detail with dates, artists, and costs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const [
    { data: dates },
    { data: artists },
    { data: costs },
    { data: travel },
  ] = await Promise.all([
    supabase
      .from("booking_dates")
      .select("*")
      .eq("booking_id", id)
      .order("date"),
    supabase
      .from("booking_artists")
      .select("*, dj_profile:dj_profiles(id, name, slug)")
      .eq("booking_id", id),
    supabase.from("booking_costs").select("*").eq("booking_id", id),
    supabase
      .from("booking_travel")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    data: {
      booking,
      dates: dates ?? [],
      artists: artists ?? [],
      costs: costs ?? [],
      travel: travel ?? [],
    },
  });
}
