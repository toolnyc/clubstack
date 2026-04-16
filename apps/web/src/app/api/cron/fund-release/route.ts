import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import { calculateTransferSplit } from "@/lib/payments/payment-math";

/** Hours after gig date before funds are released. */
const RELEASE_HOURS = 48;

/**
 * GET /api/cron/fund-release
 * Triggered every hour by Vercel cron.
 * Finds bookings where balance is paid, gig date + RELEASE_HOURS has passed,
 * and transfers funds to DJ (and agency if applicable).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Find bookings ready for fund release:
  // status = balance_paid, earliest booking_date + RELEASE_HOURS <= now
  const releaseThreshold = new Date(
    Date.now() - RELEASE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: bookings, error: queryError } = await supabase
    .from("bookings")
    .select(
      "id, created_by, booking_artists(id, dj_profile_id, fee, commission_pct), booking_dates(date)"
    )
    .eq("status", "balance_paid");

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  let released = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const booking of bookings ?? []) {
    try {
      // Check if the earliest gig date has passed the release window
      const dates = (booking.booking_dates as { date: string }[]) ?? [];
      if (dates.length === 0) {
        skipped++;
        continue;
      }

      const earliestDate = dates
        .map((d) => d.date)
        .sort()
        .pop(); // latest date (last gig)
      if (
        !earliestDate ||
        new Date(earliestDate) > new Date(releaseThreshold)
      ) {
        skipped++;
        continue;
      }

      // Get all payments for this booking
      const { data: payments } = await supabase
        .from("payments")
        .select("id, type, amount, status")
        .eq("booking_id", booking.id)
        .eq("status", "succeeded");

      if (!payments || payments.length === 0) {
        skipped++;
        continue;
      }

      // Process each artist
      const artists = booking.booking_artists as {
        id: string;
        dj_profile_id: string;
        fee: number;
        commission_pct: number;
      }[];

      for (const artist of artists) {
        const { data: djProfile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, user_id")
          .eq("id", artist.dj_profile_id)
          .single();

        if (!djProfile?.stripe_account_id) continue;

        const artistFee = Number(artist.fee);
        const commissionPct = Number(artist.commission_pct) || 0;
        const { artistAmount, agencyAmount } = calculateTransferSplit(
          artistFee,
          commissionPct
        );

        // Find a succeeded payment to link the transfer to
        const paymentId = payments[0].id;

        // Transfer to DJ
        if (artistAmount > 0) {
          const amountCents = Math.round(artistAmount * 100);
          const transfer = await stripe.transfers.create({
            amount: amountCents,
            currency: "usd",
            destination: djProfile.stripe_account_id,
            metadata: {
              booking_id: booking.id,
              type: "artist_payment",
            },
          });

          await supabase.from("transfers").insert({
            payment_id: paymentId,
            stripe_transfer_id: transfer.id,
            recipient_type: "dj",
            recipient_stripe_account: djProfile.stripe_account_id,
            amount: artistAmount,
            status: "completed",
          });
        }

        // Transfer agency commission if applicable
        if (agencyAmount > 0) {
          // Find agency Connect account via booking creator
          const { data: agencyProfile } = await supabase
            .from("dj_profiles")
            .select("stripe_account_id")
            .eq("user_id", booking.created_by)
            .single();

          // Agency owner may also have a Connect account for receiving commissions
          // If not, skip commission transfer (logged for manual resolution)
          if (agencyProfile?.stripe_account_id) {
            const commissionCents = Math.round(agencyAmount * 100);
            const transfer = await stripe.transfers.create({
              amount: commissionCents,
              currency: "usd",
              destination: agencyProfile.stripe_account_id,
              metadata: {
                booking_id: booking.id,
                type: "agency_commission",
              },
            });

            await supabase.from("transfers").insert({
              payment_id: paymentId,
              stripe_transfer_id: transfer.id,
              recipient_type: "agency",
              recipient_stripe_account: agencyProfile.stripe_account_id,
              amount: agencyAmount,
              status: "completed",
            });
          }
        }
      }

      // Update booking to completed
      await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", booking.id);

      released++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${booking.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    ran: new Date().toISOString(),
    released,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
