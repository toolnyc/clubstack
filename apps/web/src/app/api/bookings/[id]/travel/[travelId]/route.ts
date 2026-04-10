import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { z } from "zod";

const updateTravelSchema = z.object({
  type: z.enum(["flight", "hotel", "ground_transport"]).optional(),
  airline: z.string().max(100).nullable().optional(),
  flight_number: z.string().max(20).nullable().optional(),
  departure_airport: z.string().max(10).nullable().optional(),
  arrival_airport: z.string().max(10).nullable().optional(),
  departure_time: z.string().datetime({ offset: true }).nullable().optional(),
  arrival_time: z.string().datetime({ offset: true }).nullable().optional(),
  hotel_name: z.string().max(200).nullable().optional(),
  hotel_address: z.string().max(500).nullable().optional(),
  check_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  check_out: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  transport_details: z.string().max(1000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
});

/**
 * PATCH /api/bookings/[id]/travel/[travelId] — update a travel item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; travelId: string }> }
) {
  const { travelId } = await params;
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

  const parsed = updateTravelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("booking_travel")
    .update(updates)
    .eq("id", travelId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/bookings/[id]/travel/[travelId] — remove a travel item.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; travelId: string }> }
) {
  const { travelId } = await params;
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { error } = await supabase
    .from("booking_travel")
    .delete()
    .eq("id", travelId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
