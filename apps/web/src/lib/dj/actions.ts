"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
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

export async function getDJProfileBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  return data;
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const query = supabase.from("dj_profiles").select("id").eq("slug", slug);

    if (excludeId) {
      query.neq("id", excludeId);
    }

    const { data } = await query.single();
    if (!data) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
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

  // Check if profile exists
  const { data: existing } = await supabase
    .from("dj_profiles")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  const baseSlug = generateSlug(parsed.data.name);
  const slug = await ensureUniqueSlug(supabase, baseSlug, existing?.id);

  const profile = {
    ...parsed.data,
    soundcloud_url: parsed.data.soundcloud_url || null,
    instagram_url: parsed.data.instagram_url || null,
    location: parsed.data.location || null,
    bio: parsed.data.bio || null,
    slug,
    user_id: user.id,
  };

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
