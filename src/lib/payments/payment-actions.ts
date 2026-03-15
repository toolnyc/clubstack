"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { calculateTransferSplit } from "./payment-math";
import type { Payment } from "@/types";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

/**
 * Create a deposit PaymentIntent (destination charge).
 */
export async function chargeDeposit(bookingId: string) {
  const supabase = await createClient();

  // Get booking with payer and artist info
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, booking_artists(*)")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Booking not found" };
  if (!booking.payer_user_id) return { error: "No payer set on booking" };

  // Get payer's Stripe customer
  const { data: payerProfile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", booking.payer_user_id)
    .single();

  if (!payerProfile?.stripe_customer_id) {
    return { error: "Payer has no payment method" };
  }

  // Calculate deposit amount
  const totalFees = (booking.booking_artists as { fee: number }[]).reduce(
    (sum: number, a: { fee: number }) => sum + Number(a.fee),
    0
  );
  const depositPct = booking.deposit_pct ?? 50;
  const depositAmount = Math.round(((totalFees * depositPct) / 100) * 100); // cents

  if (depositAmount <= 0) return { error: "Invalid deposit amount" };

  const stripe = getStripe();

  // Get first artist's Stripe account for destination
  const firstArtist = booking.booking_artists[0];
  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("stripe_account_id")
    .eq("id", firstArtist.dj_profile_id)
    .single();

  if (!djProfile?.stripe_account_id) {
    return { error: "Artist has not set up Stripe" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: "usd",
      customer: payerProfile.stripe_customer_id,
      off_session: true,
      confirm: true,
      transfer_data: {
        destination: djProfile.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        type: "deposit",
      },
    });

    // Record payment
    await supabase.from("payments").insert({
      booking_id: bookingId,
      stripe_payment_intent_id: paymentIntent.id,
      type: "deposit",
      amount: depositAmount / 100,
      status: paymentIntent.status === "succeeded" ? "succeeded" : "processing",
      processed_at:
        paymentIntent.status === "succeeded" ? new Date().toISOString() : null,
    });

    // Update booking status
    if (paymentIntent.status === "succeeded") {
      await supabase
        .from("bookings")
        .update({ status: "deposit_paid" })
        .eq("id", bookingId);
    }

    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    return { error: message };
  }
}

/**
 * Create a balance PaymentIntent.
 */
export async function chargeBalance(bookingId: string) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, booking_artists(*)")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Booking not found" };

  const { data: payerProfile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", booking.payer_user_id)
    .single();

  if (!payerProfile?.stripe_customer_id) {
    return { error: "Payer has no payment method" };
  }

  // Calculate balance
  const totalFees = (booking.booking_artists as { fee: number }[]).reduce(
    (sum: number, a: { fee: number }) => sum + Number(a.fee),
    0
  );
  const depositPct = booking.deposit_pct ?? 50;
  const balanceAmount = Math.round(
    ((totalFees * (100 - depositPct)) / 100) * 100
  ); // cents

  if (balanceAmount <= 0) return { error: null }; // no balance needed

  const firstArtist = booking.booking_artists[0];
  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("stripe_account_id")
    .eq("id", firstArtist.dj_profile_id)
    .single();

  if (!djProfile?.stripe_account_id) {
    return { error: "Artist has not set up Stripe" };
  }

  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: balanceAmount,
      currency: "usd",
      customer: payerProfile.stripe_customer_id,
      off_session: true,
      confirm: true,
      transfer_data: {
        destination: djProfile.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        type: "balance",
      },
    });

    await supabase.from("payments").insert({
      booking_id: bookingId,
      stripe_payment_intent_id: paymentIntent.id,
      type: "balance",
      amount: balanceAmount / 100,
      status: paymentIntent.status === "succeeded" ? "succeeded" : "processing",
      processed_at:
        paymentIntent.status === "succeeded" ? new Date().toISOString() : null,
    });

    if (paymentIntent.status === "succeeded") {
      await supabase
        .from("bookings")
        .update({ status: "balance_paid" })
        .eq("id", bookingId);
    }

    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    return { error: message };
  }
}

/**
 * Get payments for a booking.
 */
export async function getPayments(bookingId: string): Promise<Payment[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at");

  return (data as Payment[]) ?? [];
}
