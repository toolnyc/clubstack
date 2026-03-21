import { NextRequest, NextResponse } from "next/server";

// Triggered every hour by Vercel cron (vercel.json)
// Finds bookings where last set end_time + release_hours_after_gig has passed,
// release_disputed = false, and funds have not yet been released.
// TODO: implement release logic in src/lib/payments/release-actions.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: query deals where release conditions are met
  // call stripe transfers to DJ and agency
  // update deals.funds_released_at

  return NextResponse.json({ ok: true, ran: new Date().toISOString() });
}
