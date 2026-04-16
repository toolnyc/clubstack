import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import type { Payment } from "@clubstack/shared";

type ChargeType = "deposit" | "balance";

/**
 * Charge a booking's deposit or balance using an already-authenticated Supabase client.
 * Shared between server actions (cookie auth) and API routes (bearer auth).
 */
export async function chargeBookingFromClient(
  supabase: SupabaseClient,
  bookingId: string,
  chargeType: ChargeType
): Promise<{ error: string | null }> {
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, booking_artists(*)")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Booking not found" };
  if (!booking.payer_user_id) return { error: "No payer set on booking" };

  const { data: payerProfile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", booking.payer_user_id)
    .single();

  if (!payerProfile?.stripe_customer_id) {
    return { error: "Payer has no payment method" };
  }

  const totalFees = (booking.booking_artists as { fee: number }[]).reduce(
    (sum: number, a: { fee: number }) => sum + Number(a.fee),
    0
  );
  const depositPct = booking.deposit_pct ?? 50;
  const chargePct = chargeType === "deposit" ? depositPct : 100 - depositPct;
  const amountCents = Math.round(((totalFees * chargePct) / 100) * 100);

  if (amountCents <= 0) {
    return chargeType === "deposit"
      ? { error: "Invalid deposit amount" }
      : { error: null };
  }

  const firstArtist = booking.booking_artists[0];
  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("stripe_account_id")
    .eq("id", firstArtist.dj_profile_id)
    .single();

  if (!djProfile?.stripe_account_id) {
    return { error: "Artist has not set up Stripe" };
  }

  const successStatus =
    chargeType === "deposit" ? "deposit_paid" : "balance_paid";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: payerProfile.stripe_customer_id,
      off_session: true,
      confirm: true,
      transfer_data: {
        destination: djProfile.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        type: chargeType,
      },
    });

    await supabase.from("payments").insert({
      booking_id: bookingId,
      stripe_payment_intent_id: paymentIntent.id,
      type: chargeType,
      amount: amountCents / 100,
      status: paymentIntent.status === "succeeded" ? "succeeded" : "processing",
      processed_at:
        paymentIntent.status === "succeeded" ? new Date().toISOString() : null,
    });

    if (paymentIntent.status === "succeeded") {
      await supabase
        .from("bookings")
        .update({ status: successStatus })
        .eq("id", bookingId);
    }

    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    return { error: message };
  }
}

/**
 * Get payments for a booking using an already-authenticated Supabase client.
 */
export async function getPaymentsFromClient(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Payment[]> {
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at");

  return (data as Payment[]) ?? [];
}
