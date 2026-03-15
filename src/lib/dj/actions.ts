"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const djProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate_min: z.number().nullable(),
  rate_max: z.number().nullable(),
  soundcloud_url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal("")),
  instagram_url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal("")),
  location: z.string().nullable().or(z.literal("")),
  bio: z.string().nullable().or(z.literal("")),
});

export type DJProfileInput = z.infer<typeof djProfileSchema>;

export async function getDJProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function saveDJProfile(input: DJProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const parsed = djProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const profile = {
    ...parsed.data,
    soundcloud_url: parsed.data.soundcloud_url || null,
    instagram_url: parsed.data.instagram_url || null,
    location: parsed.data.location || null,
    bio: parsed.data.bio || null,
    user_id: user.id,
  };

  // Check if profile exists
  const { data: existing } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("dj_profiles")
      .update(profile)
      .eq("id", existing.id)
      .select()
      .single();

    return { data, error: error?.message ?? null };
  }

  const { data, error } = await supabase
    .from("dj_profiles")
    .insert(profile)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}
