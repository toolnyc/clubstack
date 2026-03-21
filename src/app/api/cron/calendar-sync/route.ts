import { NextRequest, NextResponse } from "next/server";

// Triggered every 30 min by Vercel cron (vercel.json)
// Refreshes expired Google OAuth tokens and syncs calendar free/busy data
// TODO: implement sync logic in src/lib/calendar/sync.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: query calendar_connections where next_sync_at <= now()
  // refresh expired access tokens, fetch free/busy, upsert calendar_cache

  return NextResponse.json({ ok: true, ran: new Date().toISOString() });
}
