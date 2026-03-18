"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { canTransition, type BookingStatusOrCancelled } from "./status-machine";
import type { Booking } from "@/types";

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

export interface CreateBookingInput {
  booking: {
    venue_id?: string;
    promoter_id?: string;
    payer_type?: "venue" | "promoter";
    payer_user_id?: string;
    notes?: string;
  };
  dates: {
    date: string;
    set_time?: string;
    load_in_time?: string;
    event_name?: string;
  }[];
  artists: {
    dj_profile_id: string;
    fee: number;
    commission_pct?: number;
    payment_split_pct?: number;
  }[];
  costs: {
    description: string;
    amount: number;
    category?: "travel" | "accommodation" | "equipment" | "other";
  }[];
}

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", bookingId: null };

  // Validate
  const bookingParsed = bookingSchema.safeParse(input.booking);
  if (!bookingParsed.success) {
    return { error: bookingParsed.error.issues[0].message, bookingId: null };
  }

  if (input.dates.length === 0) {
    return { error: "At least one date is required", bookingId: null };
  }

  if (input.artists.length === 0) {
    return { error: "At least one artist is required", bookingId: null };
  }

  for (const d of input.dates) {
    const parsed = dateSchema.safeParse(d);
    if (!parsed.success) {
      return {
        error: `Invalid date: ${parsed.error.issues[0].message}`,
        bookingId: null,
      };
    }
  }

  for (const a of input.artists) {
    const parsed = artistSchema.safeParse(a);
    if (!parsed.success) {
      return {
        error: `Invalid artist: ${parsed.error.issues[0].message}`,
        bookingId: null,
      };
    }
  }

  for (const c of input.costs) {
    const parsed = costSchema.safeParse(c);
    if (!parsed.success) {
      return {
        error: `Invalid cost: ${parsed.error.issues[0].message}`,
        bookingId: null,
      };
    }
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      created_by: user.id,
      venue_id: bookingParsed.data.venue_id ?? null,
      promoter_id: bookingParsed.data.promoter_id ?? null,
      payer_type: bookingParsed.data.payer_type ?? null,
      payer_user_id: bookingParsed.data.payer_user_id ?? null,
      notes: bookingParsed.data.notes ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (bookingError) return { error: bookingError.message, bookingId: null };

  // Insert dates
  const { error: datesError } = await supabase.from("booking_dates").insert(
    input.dates.map((d) => ({
      booking_id: booking.id,
      date: d.date,
      set_time: d.set_time ?? null,
      load_in_time: d.load_in_time ?? null,
      event_name: d.event_name ?? null,
    }))
  );

  if (datesError) return { error: datesError.message, bookingId: booking.id };

  // Insert artists
  const { error: artistsError } = await supabase.from("booking_artists").insert(
    input.artists.map((a) => ({
      booking_id: booking.id,
      dj_profile_id: a.dj_profile_id,
      fee: a.fee,
      commission_pct: a.commission_pct ?? 15,
      payment_split_pct: a.payment_split_pct ?? 100,
    }))
  );

  if (artistsError)
    return { error: artistsError.message, bookingId: booking.id };

  // Insert costs
  if (input.costs.length > 0) {
    const { error: costsError } = await supabase.from("booking_costs").insert(
      input.costs.map((c) => ({
        booking_id: booking.id,
        description: c.description,
        amount: c.amount,
        category: c.category ?? null,
      }))
    );

    if (costsError) return { error: costsError.message, bookingId: booking.id };
  }

  return { error: null, bookingId: booking.id };
}

export async function getBooking(id: string) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!booking) return null;

  const [{ data: dates }, { data: artists }, { data: costs }] =
    await Promise.all([
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
    ]);

  return {
    booking,
    dates: dates ?? [],
    artists: artists ?? [],
    costs: costs ?? [],
  };
}

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as Booking[]) ?? [];
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string
) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Booking not found" };

  if (
    !canTransition(
      booking.status as BookingStatusOrCancelled,
      newStatus as BookingStatusOrCancelled
    )
  ) {
    return {
      error: `Cannot transition from ${booking.status} to ${newStatus}`,
    };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  return { error: null };
}
