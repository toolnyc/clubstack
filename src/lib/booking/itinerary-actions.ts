"use server";

import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingDate, BookingArtist, Venue } from "@/types";

export type TravelType = "flight" | "hotel" | "ground_transport";

export interface BookingTravelEntry {
  id: string;
  booking_id: string;
  type: TravelType;
  description: string;
  confirmation_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  origin: string | null;
  destination: string | null;
  notes: string | null;
  created_at: string;
}

export interface ItineraryArtist extends BookingArtist {
  dj_profile: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface Itinerary {
  booking: Booking;
  dates: BookingDate[];
  artists: ItineraryArtist[];
  travel: BookingTravelEntry[];
  venue: Venue | null;
  venueContact: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  promoterName: string | null;
}

export async function getItinerary(
  bookingId: string
): Promise<{ data: Itinerary | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { data: null, error: bookingError?.message ?? "Booking not found" };
  }

  // Fetch related data in parallel
  const [
    { data: dates },
    { data: artists },
    { data: travel },
    venueResult,
    promoterResult,
  ] = await Promise.all([
    supabase
      .from("booking_dates")
      .select("*")
      .eq("booking_id", bookingId)
      .order("date"),
    supabase
      .from("booking_artists")
      .select("*, dj_profile:dj_profiles(id, name, slug)")
      .eq("booking_id", bookingId),
    supabase
      .from("booking_travel")
      .select("*")
      .eq("booking_id", bookingId)
      .order("departure_time"),
    booking.venue_id
      ? supabase.from("venues").select("*").eq("id", booking.venue_id).single()
      : Promise.resolve({ data: null }),
    booking.promoter_id
      ? supabase
          .from("promoters")
          .select("name")
          .eq("id", booking.promoter_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Fetch venue contact if venue exists
  let venueContact: Itinerary["venueContact"] = null;
  if (booking.venue_id) {
    const { data: contact } = await supabase
      .from("venue_contacts")
      .select("user_id")
      .eq("venue_id", booking.venue_id)
      .eq("is_primary", true)
      .single();

    if (contact) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", contact.user_id)
        .single();

      venueContact = {
        name: profile?.display_name ?? null,
        email: null,
        phone: null,
      };
    }
  }

  return {
    data: {
      booking: booking as Booking,
      dates: (dates as BookingDate[]) ?? [],
      artists: (artists as ItineraryArtist[]) ?? [],
      travel: (travel as BookingTravelEntry[]) ?? [],
      venue: venueResult.data as Venue | null,
      venueContact,
      promoterName:
        (promoterResult.data as { name: string } | null)?.name ?? null,
    },
    error: null,
  };
}
