import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ProfileForm } from "@/components/dj/profile-form";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  let existingProfile = null;
  
  if (user) {
    // Fetch existing profile for this user
    const { data } = await supabase
      .from("dj_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    existingProfile = data;
  }
  
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">DJ Profile</h1>
        <p className="mt-2 text-gray-600">
          {existingProfile 
            ? "Edit your profile below. Changes are saved automatically as draft." 
            : "Create your DJ profile to start getting booked by venues."}
        </p>
      </div>
      
      {user ? (
        <ProfileForm initialData={existingProfile} />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800">Authentication Required</h2>
          <p className="mt-2 text-yellow-700">
            You need to be logged in to create or edit a DJ profile.
          </p>
        </div>
      )}
    </main>
  );
}
