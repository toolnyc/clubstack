import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { getStripe } from "@/lib/stripe/client";

/**
 * POST /api/mobile/stripe/customer
 * Create or reuse a Stripe Customer for the payer (agency/promoter),
 * then create a Checkout Session in "setup" mode to collect a payment method.
 * Returns the Checkout URL to open in an in-app browser.
 */
export async function POST(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "No profile found" }, { status: 404 });
  }

  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${baseUrl}/api/mobile/stripe/customer/callback?status=success`,
    cancel_url: `${baseUrl}/api/mobile/stripe/customer/callback?status=cancel`,
  });

  return NextResponse.json({ data: { url: session.url } });
}

/**
 * GET /api/mobile/stripe/customer
 * Check if the current user has a saved payment method.
 */
export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({
      data: { hasPaymentMethod: false, customerId: null },
    });
  }

  const paymentMethods = await getStripe().paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: "card",
    limit: 1,
  });

  return NextResponse.json({
    data: {
      hasPaymentMethod: paymentMethods.data.length > 0,
      customerId: profile.stripe_customer_id,
      card: paymentMethods.data[0]
        ? {
            brand: paymentMethods.data[0].card?.brand,
            last4: paymentMethods.data[0].card?.last4,
          }
        : null,
    },
  });
}
