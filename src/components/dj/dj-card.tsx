import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DJProfile } from "@/types";

interface DJCardProps {
  profile: DJProfile;
}

export function DJCard({ profile }: DJCardProps) {
  const displayGenres = profile.genres.slice(0, 3);
  const extraGenreCount = profile.genres.length - displayGenres.length;

  return (
    <Link href={`/djs/${profile.slug}`} className="group block">
      <Card className="transition-colors duration-200 group-hover:border-white/25 group-hover:bg-white/10">
        {/* Photo */}
        <div className="relative aspect-square w-full bg-white/5 overflow-hidden">
          {profile.photo_url ? (
            <Image
              src={profile.photo_url}
              alt={`${profile.name} photo`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-5xl text-white/20 select-none">♪</span>
            </div>
          )}
        </div>

        {/* Info */}
        <CardContent>
          <h3 className="font-semibold text-white truncate mb-1">
            {profile.name}
          </h3>

          {profile.location && (
            <p className="text-sm text-white/50 truncate mb-3">
              {profile.location}
            </p>
          )}

          {profile.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayGenres.map((genre) => (
                <Badge key={genre}>{genre}</Badge>
              ))}
              {extraGenreCount > 0 && (
                <Badge className="bg-white/5 text-white/40">
                  +{extraGenreCount}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
