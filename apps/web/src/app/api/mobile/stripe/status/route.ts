import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";

/**
 * GET /api/mobile/stripe/status
 * Return the DJ's Stripe Connect account status.
 */
export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data: djProfile } = await supabase
    .from("dj_profiles")
    .select("stripe_account_id, stripe_account_status")
    .eq("user_id", user.id)
    .single();

  if (!djProfile?.stripe_account_id) {
    return NextResponse.json({
      data: { accountId: null, status: "not_started" },
    });
  }

  return NextResponse.json({
    data: {
      accountId: djProfile.stripe_account_id,
      status: djProfile.stripe_account_status ?? "pending",
    },
  });
}
