"use server";

import { createClient } from "@/lib/supabase/server";
import type { NotificationPreference, NotificationType } from "@/types";

const NOTIFICATION_TYPES: NotificationType[] = [
  "contract_sent",
  "contract_signed",
  "payment_received",
  "payment_due",
  "booking_confirmed",
  "calendar_conflict",
  "agency_invite",
];

export async function getPreferences(): Promise<{
  preferences: NotificationPreference[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { preferences: [], error: "Not authenticated" };

  // Fetch profile id from user id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) return { preferences: [], error: "Profile not found" };

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", profile.id);

  if (error) return { preferences: [], error: error.message };

  // Fill in defaults for any missing types
  const existing = new Set(
    (data as NotificationPreference[]).map((p) => p.notification_type)
  );

  const defaults: NotificationPreference[] = NOTIFICATION_TYPES.filter(
    (type) => !existing.has(type)
  ).map((type) => ({
    id: "",
    user_id: profile.id,
    notification_type: type,
    email_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return {
    preferences: [...(data as NotificationPreference[]), ...defaults],
    error: null,
  };
}

export async function updatePreference(
  notificationType: NotificationType,
  emailEnabled: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: profile.id,
      notification_type: notificationType,
      email_enabled: emailEnabled,
    },
    { onConflict: "user_id,notification_type" }
  );

  if (error) return { error: error.message };
  return { error: null };
}

export { NOTIFICATION_TYPES };
