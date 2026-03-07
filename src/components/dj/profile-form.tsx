"use client";

import { useState } from "react";
import { DJProfile, Genre } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GenrePicker } from "@/components/dj/genre-picker";
import { saveProfile, publishProfile } from "@/app/(app)/profile/actions";

interface ProfileFormProps {
  initialData?: Partial<DJProfile> | null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [genres, setGenres] = useState<Genre[]>(initialData?.genres ?? []);
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [rateMin, setRateMin] = useState<string>(
    initialData?.rate_min != null ? String(initialData.rate_min) : ""
  );
  const [rateMax, setRateMax] = useState<string>(
    initialData?.rate_max != null ? String(initialData.rate_max) : ""
  );
  const [soundcloudUrl, setSoundcloudUrl] = useState(
    initialData?.soundcloud_url ?? ""
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialData?.instagram_url ?? ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url ?? "");

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedProfileId, setSavedProfileId] = useState<string | null>(
    initialData?.id ?? null
  );

  // Only auto-generate slug when there is no existing slug (new profile)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    !!initialData?.slug
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(slugify(value));
  }

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!slug.trim()) return "Slug is required.";
    if (!/^[a-z0-9-]+$/.test(slug))
      return "Slug may only contain lowercase letters, numbers, and hyphens.";
    if (genres.length === 0) return "Please select at least one genre.";
    if (rateMin !== "" && rateMax !== "") {
      const min = Number(rateMin);
      const max = Number(rateMax);
      if (isNaN(min) || isNaN(max)) return "Rates must be valid numbers.";
      if (min > max) return "Minimum rate cannot exceed maximum rate.";
    }
    return null;
  }

  async function handleSubmit(action: "save" | "publish") {
    setSuccessMessage(null);
    setErrorMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await saveProfile({
        name: name.trim(),
        slug: slug.trim(),
        bio: bio.trim() || undefined,
        genres,
        location: location.trim() || undefined,
        rate_min: rateMin !== "" ? Number(rateMin) : null,
        rate_max: rateMax !== "" ? Number(rateMax) : null,
        soundcloud_url: soundcloudUrl.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        photo_url: photoUrl.trim() || undefined,
      });

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      const profileId = result.id ?? savedProfileId;
      setSavedProfileId(profileId ?? null);

      if (action === "publish" && profileId) {
        const publishResult = await publishProfile(profileId);
        if (publishResult.error) {
          setErrorMessage(publishResult.error);
          return;
        }
        setSuccessMessage("Profile published successfully!");
      } else {
        setSuccessMessage("Draft saved successfully!");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Info</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="name">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Your DJ name"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="slug">
            Profile URL slug <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              clubstack.com/djs/
            </span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="your-dj-name"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-500">
            Lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="bio">
            Bio
          </label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell venues about yourself..."
            disabled={isLoading}
            rows={4}
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="location"
          >
            Location
          </label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. New York, NY"
            disabled={isLoading}
          />
        </div>
      </section>

      {/* Genres */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Genres <span className="text-red-500">*</span>
        </h2>
        <GenrePicker selectedGenres={genres} onGenresChange={setGenres} />
      </section>

      {/* Rates */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Rate Range</h2>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="rate-min"
            >
              Minimum ($)
            </label>
            <Input
              id="rate-min"
              type="number"
              min={0}
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
              placeholder="e.g. 500"
              disabled={isLoading}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="rate-max"
            >
              Maximum ($)
            </label>
            <Input
              id="rate-max"
              type="number"
              min={0}
              value={rateMax}
              onChange={(e) => setRateMax(e.target.value)}
              placeholder="e.g. 2000"
              disabled={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Social Links</h2>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="soundcloud"
          >
            SoundCloud URL
          </label>
          <Input
            id="soundcloud"
            type="url"
            value={soundcloudUrl}
            onChange={(e) => setSoundcloudUrl(e.target.value)}
            placeholder="https://soundcloud.com/your-name"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="instagram"
          >
            Instagram URL
          </label>
          <Input
            id="instagram"
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/your-name"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="website"
          >
            Website URL
          </label>
          <Input
            id="website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            disabled={isLoading}
          />
        </div>
      </section>

      {/* Photo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Photo</h2>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="photo-url"
          >
            Photo URL
          </label>
          <Input
            id="photo-url"
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://example.com/your-photo.jpg"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            Direct image upload coming soon. For now, paste a URL to your photo.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={() => handleSubmit("save")}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={() => handleSubmit("publish")}
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </div>
  );
}
