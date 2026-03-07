"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Genre } from "@/types";

interface SaveProfileData {
  name: string;
  slug: string;
  bio?: string;
  genres: Genre[];
  location?: string;
  rate_min?: number | null;
  rate_max?: number | null;
  soundcloud_url?: string;
  instagram_url?: string;
  website_url?: string;
  photo_url?: string;
}

export async function saveProfile(formData: SaveProfileData) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "You must be logged in to save a profile" };
  }
  
  // Check if slug is unique (excluding current user's profile)
  const { data: existingProfile } = await supabase
    .from("dj_profiles")
    .select("id, user_id")
    .eq("slug", formData.slug)
    .maybeSingle();
  
  if (existingProfile && existingProfile.user_id !== user.id) {
    return { error: "This slug is already taken. Please choose another one." };
  }
  
  // Prepare profile data
  const profileData = {
    user_id: user.id,
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    bio: formData.bio?.trim() || null,
    genres: formData.genres,
    location: formData.location?.trim() || null,
    rate_min: formData.rate_min,
    rate_max: formData.rate_max,
    soundcloud_url: formData.soundcloud_url?.trim() || null,
    instagram_url: formData.instagram_url?.trim() || null,
    website_url: formData.website_url?.trim() || null,
    photo_url: formData.photo_url?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  
  // Upsert the profile
  const { data, error } = await supabase
    .from("dj_profiles")
    .upsert({
      ...profileData,
      // Only set created_at on insert
      created_at: existingProfile?.user_id === user.id ? undefined : new Date().toISOString(),
    })
    .select("id")
    .single();
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/profile");
  return { id: data.id, success: true };
}

export async function publishProfile(profileId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "You must be logged in to publish a profile" };
  }
  
  // Verify the profile belongs to the current user
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("user_id")
    .eq("id", profileId)
    .single();
  
  if (!profile || profile.user_id !== user.id) {
    return { error: "You can only publish your own profile" };
  }
  
  const { error } = await supabase
    .from("dj_profiles")
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/profile");
  return { success: true };
}
