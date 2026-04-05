import Link from "next/link";
import { redirect } from "next/navigation";
import { getDJProfile } from "@/lib/dj/actions";
import { getProfile } from "@/lib/auth/actions";
import { AutoIcon } from "@/components/ui/auto-icon";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile || profile.user_type !== "dj") {
    redirect("/dashboard");
  }

  const djProfile = await getDJProfile();

  if (!djProfile) {
    return (
      <>
        <TopBar title="Profile" />
        <div className="profile-empty">
          <h2 className="profile-empty__title">No profile yet</h2>
          <p className="profile-empty__desc">
            Create your DJ profile to start getting booked.
          </p>
          <Link href="/profile/edit">
            <Button variant="primary">Create profile</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Profile"
        actions={
          <Link href="/profile/edit">
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
        }
      />
      <div className="profile-view">
        <div className="profile-view__header">
          <AutoIcon name={djProfile.name} size={64} />
          <div>
            <h2 className="profile-view__name">{djProfile.name}</h2>
            {djProfile.location && (
              <p className="profile-view__location">{djProfile.location}</p>
            )}
          </div>
        </div>

        {(djProfile.rate_min || djProfile.rate_max) && (
          <div className="profile-view__field">
            <span className="profile-view__label">Rate</span>
            <span className="profile-view__value">
              {djProfile.rate_min && djProfile.rate_max
                ? `$${djProfile.rate_min} – $${djProfile.rate_max}`
                : djProfile.rate_min
                  ? `From $${djProfile.rate_min}`
                  : `Up to $${djProfile.rate_max}`}
            </span>
          </div>
        )}

        {djProfile.bio && (
          <div className="profile-view__field">
            <span className="profile-view__label">Bio</span>
            <p className="profile-view__bio">{djProfile.bio}</p>
          </div>
        )}

        {djProfile.soundcloud_url && (
          <div className="profile-view__field">
            <span className="profile-view__label">SoundCloud</span>
            <a
              href={djProfile.soundcloud_url}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-view__link"
            >
              {djProfile.soundcloud_url}
            </a>
          </div>
        )}

        {djProfile.instagram_url && (
          <div className="profile-view__field">
            <span className="profile-view__label">Instagram</span>
            <a
              href={djProfile.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-view__link"
            >
              {djProfile.instagram_url}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
