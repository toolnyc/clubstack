import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDJProfileBySlug } from "@/lib/dj/actions";
import { AutoIcon } from "@/components/ui/auto-icon";
import { SoundCloudEmbed } from "@/components/dj/soundcloud-embed";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicDJProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getDJProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return (
    <div className="public-profile">
      <div className="public-profile__header">
        <AutoIcon name={profile.name} size={80} />
        <div className="public-profile__info">
          <h1 className="public-profile__name">{profile.name}</h1>
          {profile.location && (
            <p className="public-profile__location">{profile.location}</p>
          )}
          {(profile.rate_min || profile.rate_max) && (
            <p className="public-profile__rate">
              {profile.rate_min && profile.rate_max
                ? `$${profile.rate_min} – $${profile.rate_max}`
                : profile.rate_min
                  ? `From $${profile.rate_min}`
                  : `Up to $${profile.rate_max}`}
            </p>
          )}
        </div>
      </div>

      {profile.bio && (
        <div className="public-profile__section">
          <p className="public-profile__bio">{profile.bio}</p>
        </div>
      )}

      {profile.soundcloud_url && (
        <div className="public-profile__section">
          <h2 className="public-profile__section-title">Listen</h2>
          <SoundCloudEmbed url={profile.soundcloud_url} />
        </div>
      )}

      {profile.instagram_url && (
        <div className="public-profile__section">
          <a
            href={profile.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="public-profile__social-link"
          >
            <ExternalLink size={16} strokeWidth={1.5} />
            Instagram
          </a>
        </div>
      )}

      <footer className="public-profile__footer">
        <p className="public-profile__powered">Clubstack</p>
      </footer>
    </div>
  );
}
