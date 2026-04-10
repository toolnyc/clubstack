import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { z } from "zod";

const travelTypeSchema = z.enum(["flight", "hotel", "ground_transport"]);

const baseTravelSchema = z.object({
  type: travelTypeSchema,
  notes: z.string().max(2000).optional(),
  cost: z.number().min(0).optional(),
});

const flightSchema = baseTravelSchema.extend({
  type: z.literal("flight"),
  airline: z.string().max(100).optional(),
  flight_number: z.string().max(20).optional(),
  departure_airport: z.string().max(10).optional(),
  arrival_airport: z.string().max(10).optional(),
  departure_time: z.string().datetime({ offset: true }).optional(),
  arrival_time: z.string().datetime({ offset: true }).optional(),
});

const hotelSchema = baseTravelSchema.extend({
  type: z.literal("hotel"),
  hotel_name: z.string().max(200).optional(),
  hotel_address: z.string().max(500).optional(),
  check_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  check_out: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const groundTransportSchema = baseTravelSchema.extend({
  type: z.literal("ground_transport"),
  transport_details: z.string().max(1000).optional(),
});

const travelSchema = z.discriminatedUnion("type", [
  flightSchema,
  hotelSchema,
  groundTransportSchema,
]);

/**
 * GET /api/bookings/[id]/travel — list travel items for a booking.
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

  const { data, error } = await supabase
    .from("booking_travel")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/bookings/[id]/travel — add a travel item.
 */
export async function POST(
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

  const parsed = travelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const row: Record<string, unknown> = {
    booking_id: id,
    type: parsed.data.type,
    notes: parsed.data.notes ?? null,
    cost: parsed.data.cost ?? null,
  };

  if (parsed.data.type === "flight") {
    row.airline = parsed.data.airline ?? null;
    row.flight_number = parsed.data.flight_number ?? null;
    row.departure_airport = parsed.data.departure_airport ?? null;
    row.arrival_airport = parsed.data.arrival_airport ?? null;
    row.departure_time = parsed.data.departure_time ?? null;
    row.arrival_time = parsed.data.arrival_time ?? null;
  } else if (parsed.data.type === "hotel") {
    row.hotel_name = parsed.data.hotel_name ?? null;
    row.hotel_address = parsed.data.hotel_address ?? null;
    row.check_in = parsed.data.check_in ?? null;
    row.check_out = parsed.data.check_out ?? null;
  } else if (parsed.data.type === "ground_transport") {
    row.transport_details = parsed.data.transport_details ?? null;
  }

  const { data, error } = await supabase
    .from("booking_travel")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
