import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeToken } from "@/lib/google/oauth";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get existing connection
  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  if (connection) {
    // Revoke token with Google (best effort)
    try {
      await revokeToken(connection.access_token);
    } catch {
      // Token may already be revoked, continue with cleanup
    }

    // Delete connection
    await supabase
      .from("calendar_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "google");

    // Clear cached calendar data
    await supabase.from("calendar_cache").delete().eq("user_id", user.id);
  }

  return NextResponse.json({ data: null, error: null });
}
