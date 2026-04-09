import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { calculateDealSummary } from "@/lib/booking/deal-math";

/**
 * GET /api/bookings/[id]/deal-math — calculate deal summary for a booking.
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

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const [{ data: artists }, { data: costs }] = await Promise.all([
    supabase.from("booking_artists").select("*").eq("booking_id", id),
    supabase.from("booking_costs").select("*").eq("booking_id", id),
  ]);

  const summary = calculateDealSummary(
    (artists ?? []).map((a) => ({
      fee: a.fee,
      commission_pct: a.commission_pct,
      payment_split_pct: a.payment_split_pct,
    })),
    (costs ?? []).map((c) => ({ amount: c.amount }))
  );

  return NextResponse.json({ data: summary });
}
