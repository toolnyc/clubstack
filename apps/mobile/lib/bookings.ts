import type {
  Booking,
  BookingArtist,
  BookingCost,
  BookingDate,
  BookingTravel,
  CostCategory,
  CreateBookingInput,
} from "@clubstack/shared";

import { supabase } from "./supabase";

export interface BookingDetail {
  booking: Booking;
  dates: BookingDate[];
  artists: (BookingArtist & {
    dj_profile: { id: string; name: string; slug: string };
  })[];
  costs: BookingCost[];
  travel: BookingTravel[];
}

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Booking[]) ?? [];
}

export async function getBooking(id: string): Promise<BookingDetail> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !booking) throw new Error("Booking not found");

  const [datesRes, artistsRes, costsRes, travelRes] = await Promise.all([
    supabase.from("booking_dates").select("*").eq("booking_id", id).order("date"),
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

  return {
    booking: booking as Booking,
    dates: (datesRes.data as BookingDate[]) ?? [],
    artists: (artistsRes.data as BookingDetail["artists"]) ?? [],
    costs: (costsRes.data as BookingCost[]) ?? [],
    travel: (travelRes.data as BookingTravel[]) ?? [],
  };
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      created_by: session.user.id,
      venue_id: input.booking.venue_id ?? null,
      promoter_id: input.booking.promoter_id ?? null,
      payer_type: input.booking.payer_type ?? null,
      payer_user_id: input.booking.payer_user_id ?? null,
      notes: input.booking.notes ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (bookingError) throw new Error(bookingError.message);

  const { error: datesError } = await supabase.from("booking_dates").insert(
    input.dates.map((d) => ({
      booking_id: booking.id,
      date: d.date,
      set_time: d.set_time ?? null,
      load_in_time: d.load_in_time ?? null,
      event_name: d.event_name ?? null,
    }))
  );
  if (datesError) throw new Error(datesError.message);

  const { error: artistsError } = await supabase.from("booking_artists").insert(
    input.artists.map((a) => ({
      booking_id: booking.id,
      dj_profile_id: a.dj_profile_id,
      fee: a.fee,
      commission_pct: a.commission_pct ?? 15,
      payment_split_pct: a.payment_split_pct ?? 100,
    }))
  );
  if (artistsError) throw new Error(artistsError.message);

  if (input.costs.length > 0) {
    const { error: costsError } = await supabase.from("booking_costs").insert(
      input.costs.map((c) => ({
        booking_id: booking.id,
        description: c.description,
        amount: c.amount,
        category: c.category ?? null,
      }))
    );
    if (costsError) throw new Error(costsError.message);
  }

  return booking.id as string;
}

// --- Costs ---

export interface CostInput {
  description: string;
  amount: number;
  category?: CostCategory | null;
}

export async function addCost(
  bookingId: string,
  input: CostInput
): Promise<BookingCost> {
  const { data, error } = await supabase
    .from("booking_costs")
    .insert({
      booking_id: bookingId,
      description: input.description,
      amount: input.amount,
      category: input.category ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BookingCost;
}

export async function updateCost(
  costId: string,
  input: Partial<CostInput>
): Promise<BookingCost> {
  const updates: Record<string, unknown> = {};
  if (input.description !== undefined) updates.description = input.description;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.category !== undefined) updates.category = input.category;

  const { data, error } = await supabase
    .from("booking_costs")
    .update(updates)
    .eq("id", costId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BookingCost;
}

export async function removeCost(costId: string): Promise<void> {
  const { error } = await supabase
    .from("booking_costs")
    .delete()
    .eq("id", costId);

  if (error) throw new Error(error.message);
}

// --- Travel ---

export async function addTravel(
  bookingId: string,
  input: Record<string, unknown>
): Promise<BookingTravel> {
  const { data, error } = await supabase
    .from("booking_travel")
    .insert({ ...input, booking_id: bookingId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BookingTravel;
}

export async function updateTravel(
  travelId: string,
  input: Record<string, unknown>
): Promise<BookingTravel> {
  const { data, error } = await supabase
    .from("booking_travel")
    .update(input)
    .eq("id", travelId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BookingTravel;
}

export async function removeTravel(travelId: string): Promise<void> {
  const { error } = await supabase
    .from("booking_travel")
    .delete()
    .eq("id", travelId);

  if (error) throw new Error(error.message);
}
