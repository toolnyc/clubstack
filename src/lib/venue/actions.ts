"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Venue } from "@/types";

const venueSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  location: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  capacity: z.number().int().positive().optional(),
});

export async function getVenue(): Promise<Venue | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: contact } = await supabase
    .from("venue_contacts")
    .select("venue_id")
    .eq("user_id", user.id)
    .single();

  if (!contact) return null;

  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("id", contact.venue_id)
    .single();

  return data;
}

export async function createVenue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
    address: formData.get("address") || undefined,
    capacity: formData.get("capacity")
      ? Number(formData.get("capacity"))
      : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .insert({
      name: parsed.data.name,
      location: parsed.data.location ?? null,
      address: parsed.data.address ?? null,
      capacity: parsed.data.capacity ?? null,
    })
    .select("id")
    .single();

  if (venueError) return { error: venueError.message };

  // Create primary contact link
  const { error: contactError } = await supabase.from("venue_contacts").insert({
    venue_id: venue.id,
    user_id: user.id,
    is_primary: true,
  });

  if (contactError) return { error: contactError.message };
  return { error: null };
}

export async function updateVenue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
    address: formData.get("address") || undefined,
    capacity: formData.get("capacity")
      ? Number(formData.get("capacity"))
      : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Get venue via contact
  const { data: contact } = await supabase
    .from("venue_contacts")
    .select("venue_id")
    .eq("user_id", user.id)
    .single();

  if (!contact) return { error: "No venue found" };

  const { error } = await supabase
    .from("venues")
    .update({
      name: parsed.data.name,
      location: parsed.data.location ?? null,
      address: parsed.data.address ?? null,
      capacity: parsed.data.capacity ?? null,
    })
    .eq("id", contact.venue_id);

  if (error) return { error: error.message };
  return { error: null };
}
