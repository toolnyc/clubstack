"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { AutoIcon } from "@/components/ui/auto-icon";
import { saveDJProfile } from "@/lib/dj/actions";
import type { DJProfile } from "@/types";

interface ProfileFormProps {
  initialData?: DJProfile | null;
}

function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [rateMin, setRateMin] = useState(
    initialData?.rate_min?.toString() ?? ""
  );
  const [rateMax, setRateMax] = useState(
    initialData?.rate_max?.toString() ?? ""
  );
  const [soundcloudUrl, setSoundcloudUrl] = useState(
    initialData?.soundcloud_url ?? ""
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialData?.instagram_url ?? ""
  );
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await saveDJProfile({
      name,
      rate_min: rateMin ? Number(rateMin) : null,
      rate_max: rateMax ? Number(rateMax) : null,
      soundcloud_url: soundcloudUrl || null,
      instagram_url: instagramUrl || null,
      location: location || null,
      bio: bio || null,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="profile-form__header">
        <AutoIcon name={name || "DJ"} size={64} />
        <p className="profile-form__icon-hint">Auto-generated from your name</p>
      </div>

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your DJ name"
        required
      />

      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g. Brooklyn, NY"
        optional
      />

      <div className="profile-form__rate-row">
        <Input
          label="Min rate"
          type="number"
          value={rateMin}
          onChange={(e) => setRateMin(e.target.value)}
          placeholder="500"
          optional
        />
        <Input
          label="Max rate"
          type="number"
          value={rateMax}
          onChange={(e) => setRateMax(e.target.value)}
          placeholder="2000"
          optional
        />
      </div>

      <Input
        label="SoundCloud"
        type="url"
        value={soundcloudUrl}
        onChange={(e) => setSoundcloudUrl(e.target.value)}
        placeholder="https://soundcloud.com/..."
        optional
      />

      <Input
        label="Instagram"
        type="url"
        value={instagramUrl}
        onChange={(e) => setInstagramUrl(e.target.value)}
        placeholder="https://instagram.com/..."
        optional
      />

      <Textarea
        label="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Tell venues and promoters about yourself..."
        optional
      />

      {error && <p className="profile-form__error">{error}</p>}

      <div className="profile-form__actions">
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? "Save changes" : "Create profile"}
        </Button>
      </div>
    </form>
  );
}

export { ProfileForm };
