import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service role client for server-side operations that bypass RLS.
 * Only use in cron jobs, webhooks, and other server-only contexts.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}
