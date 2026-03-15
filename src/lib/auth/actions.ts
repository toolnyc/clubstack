"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserType } from "@/types";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function createProfile(userType: UserType, displayName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    user_type: userType,
    display_name: displayName,
  });

  if (error) {
    return { error: error.message };
  }

  // Auto-create type-specific records
  if (userType === "agency") {
    await supabase.from("agencies").insert({
      user_id: user.id,
      name: displayName,
    });
  } else if (userType === "venue_contact") {
    const { data: venue } = await supabase
      .from("venues")
      .insert({ name: displayName })
      .select("id")
      .single();

    if (venue) {
      await supabase.from("venue_contacts").insert({
        venue_id: venue.id,
        user_id: user.id,
        is_primary: true,
      });
    }
  } else if (userType === "promoter") {
    await supabase.from("promoters").insert({
      user_id: user.id,
      name: displayName,
    });
  }

  return { error: null };
}
