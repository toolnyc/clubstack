import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import {
  canTransition,
  type BookingStatusOrCancelled,
} from "@/lib/booking/status-machine";
import { z } from "zod";

const statusSchema = z.object({
  status: z.string().min(1),
});

/**
 * PATCH /api/bookings/[id]/status — transition booking status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const from = booking.status as BookingStatusOrCancelled;
  const to = parsed.data.status as BookingStatusOrCancelled;

  if (!canTransition(from, to)) {
    return NextResponse.json(
      { error: `Cannot transition from ${from} to ${to}` },
      { status: 422 }
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: to })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { status: to } });
}
