import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getValidToken, fetchFreeBusy } from "@/lib/google/calendar";

// Triggered every 30 min by Vercel cron (vercel.json)
// Refreshes expired Google OAuth tokens and syncs calendar free/busy data
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Fetch all active connections (not revoked)
  const { data: connections, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .neq("sync_status", "revoked");

  if (error || !connections) {
    return NextResponse.json(
      { error: error?.message ?? "No connections", synced: 0 },
      { status: 500 }
    );
  }

  let synced = 0;
  let errors = 0;
  const results: { userId: string; status: string; error?: string }[] = [];

  for (const connection of connections) {
    try {
      // Mark as syncing
      await supabase
        .from("calendar_connections")
        .update({ sync_status: "syncing" })
        .eq("id", connection.id);

      // Get valid token (refresh if needed)
      const { access_token, refreshed, expires_at } =
        await getValidToken(connection);

      // Update token if refreshed
      if (refreshed) {
        await supabase
          .from("calendar_connections")
          .update({
            access_token,
            token_expires_at: expires_at.toISOString(),
          })
          .eq("id", connection.id);
      }

      // Fetch free/busy for next 30 days
      const timeMin = new Date(now);
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + 30);

      const busyDays = await fetchFreeBusy(
        access_token,
        connection.calendar_id,
        timeMin,
        timeMax
      );

      // Upsert cache with fresh data
      if (busyDays.length > 0) {
        const cacheRows = busyDays.map((d) => ({
          user_id: connection.user_id,
          date: d.date,
          status: d.status,
          cached_at: now.toISOString(),
        }));

        await supabase.from("calendar_cache").upsert(cacheRows, {
          onConflict: "user_id,date",
        });
      }

      // Mark as active with last sync time
      await supabase
        .from("calendar_connections")
        .update({
          sync_status: "active",
          last_synced_at: now.toISOString(),
          sync_error: null,
        })
        .eq("id", connection.id);

      synced++;
      results.push({ userId: connection.user_id, status: "synced" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      // Check for revoked access
      const isRevoked =
        message.includes("invalid_grant") ||
        message.includes("Token has been expired or revoked");

      await supabase
        .from("calendar_connections")
        .update({
          sync_status: isRevoked ? "revoked" : "error",
          sync_error: message,
        })
        .eq("id", connection.id);

      errors++;
      results.push({
        userId: connection.user_id,
        status: isRevoked ? "revoked" : "error",
        error: message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    ran: now.toISOString(),
    synced,
    errors,
    total: connections.length,
    results,
  });
}
