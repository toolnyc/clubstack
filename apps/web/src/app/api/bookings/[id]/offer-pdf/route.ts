import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { calculateDealSummary } from "@clubstack/shared";
import { renderOfferPdf } from "@/lib/pdf/offer-document";
import type { OfferDocumentData } from "@/lib/pdf/offer-document";

/**
 * GET /api/bookings/[id]/offer-pdf — render a branded offer PDF for a booking.
 *
 * Returns application/pdf inline. RLS on the underlying tables is the
 * authorization boundary — if the authenticated user cannot read the
 * booking, the query returns no rows and we respond 404.
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

  // Load booking (RLS-filtered)
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Related data in parallel
  const [
    { data: dates },
    { data: artists },
    { data: costs },
    { data: venue },
    { data: promoter },
    { data: agency },
  ] = await Promise.all([
    supabase
      .from("booking_dates")
      .select("date, event_name, set_time, load_in_time")
      .eq("booking_id", id)
      .order("date"),
    supabase
      .from("booking_artists")
      .select(
        "fee, commission_pct, payment_split_pct, dj_profile:dj_profiles(name)"
      )
      .eq("booking_id", id),
    supabase.from("booking_costs").select("amount").eq("booking_id", id),
    booking.venue_id
      ? supabase
          .from("venues")
          .select("name, location")
          .eq("id", booking.venue_id)
          .single()
      : Promise.resolve({ data: null }),
    booking.promoter_id
      ? supabase
          .from("promoters")
          .select("name, location")
          .eq("id", booking.promoter_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("agencies")
      .select("name, location")
      .eq("user_id", booking.created_by)
      .maybeSingle(),
  ]);

  const artistRows = (artists ?? []).map((a) => {
    const profile = a.dj_profile as unknown as { name: string } | null;
    return {
      name: profile?.name ?? "Artist",
      fee: Number(a.fee),
      commission_pct: Number(a.commission_pct),
      payment_split_pct: Number(a.payment_split_pct),
    };
  });

  const dealSummary = calculateDealSummary(
    artistRows.map((a) => ({
      fee: a.fee,
      commission_pct: a.commission_pct,
      payment_split_pct: a.payment_split_pct,
    })),
    (costs ?? []).map((c) => ({ amount: Number(c.amount) }))
  );

  let counterparty: OfferDocumentData["counterparty"];
  if (venue) {
    counterparty = {
      label: "Venue",
      name: venue.name,
      location: venue.location,
    };
  } else if (promoter) {
    counterparty = {
      label: "Promoter",
      name: promoter.name,
      location: promoter.location,
    };
  } else {
    counterparty = { label: "Counterparty", name: null, location: null };
  }

  const data: OfferDocumentData = {
    agency: agency ? { name: agency.name, location: agency.location } : null,
    booking: {
      id: booking.id,
      status: booking.status,
      notes: booking.notes,
    },
    dates: (dates ?? []).map((d) => ({
      date: d.date,
      event_name: d.event_name,
      set_time: d.set_time,
      load_in_time: d.load_in_time,
    })),
    artists: artistRows,
    counterparty,
    dealSummary,
    generatedAt: new Date().toISOString(),
  };

  try {
    const pdf = await renderOfferPdf(data);
    const filename = `offer-${booking.id.slice(0, 8)}.pdf`;
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
