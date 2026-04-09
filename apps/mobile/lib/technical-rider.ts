import type { EquipmentRequirements, TechnicalRider } from "@clubstack/shared";

import { supabase } from "./supabase";

export interface RiderInput {
  equipment: EquipmentRequirements;
  booth_monitors?: string | null;
  booth_requirements?: string | null;
  power_requirements?: string | null;
  hospitality?: string | null;
}

export async function getRider(
  djProfileId: string
): Promise<TechnicalRider | null> {
  const { data, error } = await supabase
    .from("technical_riders")
    .select("*")
    .eq("dj_profile_id", djProfileId)
    .eq("is_current", true)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data as TechnicalRider | null;
}

export async function saveRider(
  djProfileId: string,
  input: RiderInput
): Promise<TechnicalRider> {
  // Get existing current rider for version bump
  const { data: existing } = await supabase
    .from("technical_riders")
    .select("id, version")
    .eq("dj_profile_id", djProfileId)
    .eq("is_current", true)
    .single();

  const nextVersion = existing ? (existing.version as number) + 1 : 1;

  // Mark old rider as not current
  if (existing) {
    const { error: updateError } = await supabase
      .from("technical_riders")
      .update({ is_current: false })
      .eq("id", existing.id);

    if (updateError) throw new Error(updateError.message);
  }

  // Insert new versioned rider
  const { data, error } = await supabase
    .from("technical_riders")
    .insert({
      dj_profile_id: djProfileId,
      version: nextVersion,
      equipment: input.equipment,
      booth_monitors: input.booth_monitors ?? null,
      booth_requirements: input.booth_requirements ?? null,
      power_requirements: input.power_requirements ?? null,
      hospitality: input.hospitality ?? null,
      is_current: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TechnicalRider;
}
