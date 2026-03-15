import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google/oauth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/calendar?error=google_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/calendar?error=missing_params`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${origin}/calendar?error=auth_mismatch`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/calendar?error=no_refresh_token`);
    }

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Upsert calendar connection
    await supabase.from("calendar_connections").upsert(
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

    return NextResponse.redirect(`${origin}/calendar?connected=true`);
  } catch {
    return NextResponse.redirect(`${origin}/calendar?error=token_exchange`);
  }
}
