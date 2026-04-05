import { redirect } from "next/navigation";
import { getDJProfile } from "@/lib/dj/actions";
import { getProfile } from "@/lib/auth/actions";
import { ProfileForm } from "@/components/dj/profile-form";
import { TopBar } from "@/components/layout/top-bar";

export default async function ProfileEditPage() {
  const profile = await getProfile();

  if (!profile || profile.user_type !== "dj") {
    redirect("/dashboard");
  }

  const djProfile = await getDJProfile();

  return (
    <>
      <TopBar title={djProfile ? "Edit profile" : "Create profile"} />
      <div className="profile-edit">
        <ProfileForm initialData={djProfile} />
      </div>
    </>
  );
}
