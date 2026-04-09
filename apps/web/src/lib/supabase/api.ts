import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Create a Supabase client from a Bearer token in the Authorization header.
 * Used by API route handlers that serve the mobile app.
 *
 * Falls back to the cookie-based server client if no Authorization header
 * is present, so web callers still work.
 */
export function createClientFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: { persistSession: false },
    }
  );

  return client;
}

/**
 * Standard 401 response for unauthenticated API requests.
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}
