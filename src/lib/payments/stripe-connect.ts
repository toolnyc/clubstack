"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

/**
 * Create a Stripe Connect Express account for a DJ.
 * Returns the onboarding URL.
 */
export async function createConnectAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", url: null };

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!djProfile) return { error: "No DJ profile found", url: null };

  const stripe = getStripe();

  let accountId = djProfile.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        dj_profile_id: djProfile.id,
        user_id: user.id,
      },
    });
    accountId = account.id;

    await supabase
      .from("dj_profiles")
      .update({
        stripe_account_id: accountId,
        stripe_account_status: "pending",
      })
      .eq("id", djProfile.id);
  }

  // Create account link for onboarding
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/profile?stripe=refresh`,
    return_url: `${baseUrl}/profile?stripe=complete`,
    type: "account_onboarding",
  });

  return { error: null, url: accountLink.url };
}

/**
 * Check the status of a DJ's Stripe Connect account.
 */
export async function getConnectAccountStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("stripe_account_id, stripe_account_status")
    .eq("user_id", user.id)
    .single();

  if (!djProfile?.stripe_account_id) return null;

  return {
    accountId: djProfile.stripe_account_id,
    status: djProfile.stripe_account_status as string,
  };
}

/**
 * Create a Stripe Customer for a venue/promoter payer.
 */
export async function createStripeCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", clientSecret: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "No profile found", clientSecret: null };

  const stripe = getStripe();

  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: {
        user_id: user.id,
      },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // Create SetupIntent for saving payment method
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
  });

  return { error: null, clientSecret: setupIntent.client_secret };
}

/**
 * Get the Stripe Customer ID for the current user.
 */
export async function getStripeCustomerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  return profile?.stripe_customer_id ?? null;
}
