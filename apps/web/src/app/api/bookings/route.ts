import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import type { Booking } from "@clubstack/shared";
import { z } from "zod";
import { createBookingFromClient } from "@/lib/booking/booking-api";

/**
 * GET /api/bookings — list all bookings for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data as Booking[]) ?? [] });
}

const bookingSchema = z.object({
  venue_id: z.string().uuid().optional(),
  promoter_id: z.string().uuid().optional(),
  payer_type: z.enum(["venue", "promoter"]).optional(),
  payer_user_id: z.string().uuid().optional(),
  notes: z.string().max(5000).optional(),
});

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  set_time: z.string().optional(),
  load_in_time: z.string().optional(),
  event_name: z.string().max(200).optional(),
});

const artistSchema = z.object({
  dj_profile_id: z.string().uuid(),
  fee: z.number().min(0),
  commission_pct: z.number().min(0).max(100).default(15),
  payment_split_pct: z.number().min(0).max(100).default(100),
});

const costSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().min(0),
  category: z
    .enum(["travel", "accommodation", "equipment", "other"])
    .optional(),
});

const createBookingSchema = z.object({
  booking: bookingSchema,
  dates: z.array(dateSchema).min(1, "At least one date is required"),
  artists: z.array(artistSchema).min(1, "At least one artist is required"),
  costs: z.array(costSchema).default([]),
});

/**
 * POST /api/bookings — create a new booking.
 */
export async function POST(request: NextRequest) {
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

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const result = await createBookingFromClient(supabase, user.id, parsed.data);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    { data: { bookingId: result.bookingId } },
    { status: 201 }
  );
}
