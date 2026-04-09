import * as ImagePicker from "expo-image-picker";
import {
  generateSlug,
  type DJProfile,
  type FieldVisibility,
  type PressKit,
  type PressKitFile,
} from "@clubstack/shared";

import { supabase } from "./supabase";

export interface DJProfileInput {
  name: string;
  bio?: string | null;
  location?: string | null;
  rate_min?: number | null;
  rate_max?: number | null;
  soundcloud_url?: string | null;
  instagram_url?: string | null;
  genres?: string[] | null;
}

export async function getDJProfile(userId: string): Promise<DJProfile | null> {
  const { data, error } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data as DJProfile | null;
}

export async function saveDJProfile(
  userId: string,
  input: DJProfileInput
): Promise<DJProfile> {
  const existing = await getDJProfile(userId);

  if (existing) {
    const { data, error } = await supabase
      .from("dj_profiles")
      .update({
        name: input.name,
        bio: input.bio ?? null,
        location: input.location ?? null,
        rate_min: input.rate_min ?? null,
        rate_max: input.rate_max ?? null,
        soundcloud_url: input.soundcloud_url ?? null,
        instagram_url: input.instagram_url ?? null,
        genres: input.genres ?? null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DJProfile;
  }

  // New profile — generate slug with uniqueness check
  let slug = generateSlug(input.name);
  const { data: slugCheck } = await supabase
    .from("dj_profiles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (slugCheck) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const { data, error } = await supabase
    .from("dj_profiles")
    .insert({
      user_id: userId,
      name: input.name,
      slug,
      bio: input.bio ?? null,
      location: input.location ?? null,
      rate_min: input.rate_min ?? null,
      rate_max: input.rate_max ?? null,
      soundcloud_url: input.soundcloud_url ?? null,
      instagram_url: input.instagram_url ?? null,
      genres: input.genres ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DJProfile;
}

export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<string> {
  const ext = imageUri.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Save avatar URL to profile
  await supabase
    .from("dj_profiles")
    .update({ avatar_url: publicUrl })
    .eq("user_id", userId);

  return publicUrl;
}

export async function pickAndUploadAvatar(
  userId: string
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  return uploadAvatar(userId, result.assets[0].uri);
}

export async function uploadPressKitFile(
  userId: string,
  djProfileId: string,
  fileUri: string,
  fileName: string,
  fileType: "mixes" | "photos" | "one_sheets"
): Promise<PressKitFile> {
  const ext = fileName.split(".").pop() ?? "bin";
  const path = `${userId}/${fileType}/${Date.now()}-${fileName}`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("press-kits")
    .upload(path, blob, { contentType: blob.type });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("press-kits").getPublicUrl(path);

  const file: PressKitFile = {
    url: publicUrl,
    name: fileName,
    type: ext,
    uploaded_at: new Date().toISOString(),
  };

  // Append to press_kit JSONB
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("press_kit")
    .eq("id", djProfileId)
    .single();

  const pressKit: PressKit = (profile?.press_kit as PressKit) ?? {};
  const files = pressKit[fileType] ?? [];
  files.push(file);
  pressKit[fileType] = files;

  await supabase
    .from("dj_profiles")
    .update({ press_kit: pressKit })
    .eq("id", djProfileId);

  return file;
}

export async function removePressKitFile(
  djProfileId: string,
  fileUrl: string,
  fileType: "mixes" | "photos" | "one_sheets"
): Promise<void> {
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("press_kit")
    .eq("id", djProfileId)
    .single();

  if (!profile) return;

  const pressKit: PressKit = (profile.press_kit as PressKit) ?? {};
  const files = pressKit[fileType] ?? [];
  pressKit[fileType] = files.filter((f) => f.url !== fileUrl);

  await supabase
    .from("dj_profiles")
    .update({ press_kit: pressKit })
    .eq("id", djProfileId);

  // Delete from storage
  const urlParts = fileUrl.split("/press-kits/");
  if (urlParts[1]) {
    await supabase.storage.from("press-kits").remove([urlParts[1]]);
  }
}

export async function updateFieldVisibility(
  djProfileId: string,
  visibility: FieldVisibility
): Promise<void> {
  const { error } = await supabase
    .from("dj_profiles")
    .update({ field_visibility: visibility })
    .eq("id", djProfileId);

  if (error) throw new Error(error.message);
}

export async function getRiderSummary(
  djProfileId: string
): Promise<{ equipment_count: number; has_rider: boolean } | null> {
  const { data } = await supabase
    .from("technical_riders")
    .select("equipment")
    .eq("dj_profile_id", djProfileId)
    .eq("is_current", true)
    .single();

  if (!data) return null;

  const equipment = data.equipment as Record<string, unknown>;
  const equipmentCount = Object.values(equipment).filter(
    (v) => v === true || (typeof v === "string" && v.length > 0)
  ).length;

  return { equipment_count: equipmentCount, has_rider: true };
}
