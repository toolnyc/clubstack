import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { stripe } from "@/lib/stripe/client";

/**
 * POST /api/mobile/stripe/connect
 * Create or resume Stripe Connect Express onboarding for a DJ.
 * Returns the hosted onboarding URL to open in an in-app browser.
 */
export async function POST(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!djProfile) {
    return NextResponse.json({ error: "No DJ profile found" }, { status: 404 });
  }

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/mobile/stripe/connect/callback?status=refresh`,
    return_url: `${baseUrl}/api/mobile/stripe/connect/callback?status=complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({ data: { url: accountLink.url } });
}
