import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google/oauth";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { code?: string; redirect_uri?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, redirect_uri } = body;

  if (!code || !redirect_uri) {
    return NextResponse.json(
      { error: "Missing code or redirect_uri" },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirect_uri);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: "No refresh token returned. Please re-authorize." },
        { status: 400 }
      );
    }

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const { error: dbError } = await supabase
      .from("calendar_connections")
      .upsert(
        {
          user_id: user.id,
          provider: "google",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          calendar_id: "primary",
        },
        { onConflict: "user_id,provider" }
      );

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to save calendar connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { connected: true }, error: null });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
