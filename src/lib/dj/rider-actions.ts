"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const equipmentSchema = z.object({
  cdjs: z.boolean().optional(),
  cdj_model: z.string().optional(),
  turntables: z.boolean().optional(),
  turntable_model: z.string().optional(),
  mixer: z.boolean().optional(),
  mixer_model: z.string().optional(),
  needles_provided: z.boolean().optional(),
  usb_required: z.boolean().optional(),
  laptop_stand: z.boolean().optional(),
  other: z.string().optional(),
});

const riderSchema = z.object({
  equipment: equipmentSchema,
  booth_monitors: z.string().nullable().or(z.literal("")),
  booth_requirements: z.string().nullable().or(z.literal("")),
  power_requirements: z.string().nullable().or(z.literal("")),
  hospitality: z.string().nullable().or(z.literal("")),
});

export type RiderInput = z.infer<typeof riderSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;

export async function getRider() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get the DJ profile for this user
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return null;

  const { data } = await supabase
    .from("technical_riders")
    .select("*")
    .eq("dj_profile_id", profile.id)
    .eq("is_current", true)
    .single();

  return data;
}

export async function getRiderByDJProfileId(djProfileId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("technical_riders")
    .select("*")
    .eq("dj_profile_id", djProfileId)
    .eq("is_current", true)
    .single();

  return data;
}

export async function saveRider(input: RiderInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const parsed = riderSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  // Get the DJ profile for this user
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { data: null, error: "DJ profile not found" };
  }

  // Check for existing current rider
  const { data: existing } = await supabase
    .from("technical_riders")
    .select("id, version")
    .eq("dj_profile_id", profile.id)
    .eq("is_current", true)
    .single();

  const nextVersion = existing ? existing.version + 1 : 1;

  // Mark old rider as not current
  if (existing) {
    const { error: updateError } = await supabase
      .from("technical_riders")
      .update({ is_current: false })
      .eq("id", existing.id);

    if (updateError) {
      return { data: null, error: updateError.message };
    }
  }

  // Insert new versioned rider
  const { data, error } = await supabase
    .from("technical_riders")
    .insert({
      dj_profile_id: profile.id,
      version: nextVersion,
      equipment: parsed.data.equipment,
      booth_monitors: parsed.data.booth_monitors || null,
      booth_requirements: parsed.data.booth_requirements || null,
      power_requirements: parsed.data.power_requirements || null,
      hospitality: parsed.data.hospitality || null,
      is_current: true,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}
