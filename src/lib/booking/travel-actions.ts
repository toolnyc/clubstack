"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { BookingTravel, TravelType } from "@/types";

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

type TravelInput = z.infer<typeof travelSchema>;

const updateTravelSchema = z.object({
  type: travelTypeSchema.optional(),
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

export async function getTravel(
  bookingId: string
): Promise<{ data: BookingTravel[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("booking_travel")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data as BookingTravel[]) ?? [], error: null };
}

export async function addTravel(
  bookingId: string,
  input: TravelInput
): Promise<{ data: BookingTravel | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Not authenticated" };

  const parsed = travelSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const row: Record<string, unknown> = {
    booking_id: bookingId,
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

  if (error) return { data: null, error: error.message };

  return { data: data as BookingTravel, error: null };
}

export async function updateTravel(
  id: string,
  input: z.infer<typeof updateTravelSchema>
): Promise<{ data: BookingTravel | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Not authenticated" };

  const parsed = updateTravelSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  // Filter out undefined keys — only send fields that were explicitly provided
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { data: null, error: "No fields to update" };
  }

  const { data, error } = await supabase
    .from("booking_travel")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  return { data: data as BookingTravel, error: null };
}

export async function removeTravel(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("booking_travel").delete().eq("id", id);

  if (error) return { error: error.message };

  return { error: null };
}
