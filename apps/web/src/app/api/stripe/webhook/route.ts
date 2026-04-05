import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const status = account.charges_enabled ? "active" : "restricted";

      await supabase
        .from("dj_profiles")
        .update({ stripe_account_status: status })
        .eq("stripe_account_id", account.id);
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = pi.metadata?.booking_id;
      const type = pi.metadata?.type;

      if (bookingId) {
        await supabase
          .from("payments")
          .update({
            status: "succeeded",
            processed_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id);

        const newStatus = type === "deposit" ? "deposit_paid" : "balance_paid";
        await supabase
          .from("bookings")
          .update({ status: newStatus })
          .eq("id", bookingId);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
