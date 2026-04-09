import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateBookingInput } from "@clubstack/shared";

/**
 * Create a booking using an already-authenticated Supabase client.
 * Shared between server actions (cookie auth) and API routes (bearer auth).
 */
export async function createBookingFromClient(
  supabase: SupabaseClient,
  userId: string,
  input: CreateBookingInput
): Promise<{ error: string | null; bookingId: string | null }> {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      created_by: userId,
      venue_id: input.booking.venue_id ?? null,
      promoter_id: input.booking.promoter_id ?? null,
      payer_type: input.booking.payer_type ?? null,
      payer_user_id: input.booking.payer_user_id ?? null,
      notes: input.booking.notes ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (bookingError) return { error: bookingError.message, bookingId: null };

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
