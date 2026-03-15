"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Promoter } from "@/types";

const promoterSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  location: z.string().max(200).optional(),
});

export async function getPromoter(): Promise<Promoter | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("promoters")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function createPromoter(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = promoterSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("promoters").insert({
    user_id: user.id,
    name: parsed.data.name,
    location: parsed.data.location ?? null,
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePromoter(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = promoterSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("promoters")
    .update({
      name: parsed.data.name,
      location: parsed.data.location ?? null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { error: null };
}
