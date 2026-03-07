import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DJCard } from "@/components/dj/dj-card";
import { GenreFilter } from "@/components/dj/genre-filter";
import { SearchInput } from "@/components/dj/search-input";
import { GENRES } from "@/types";
import type { DJProfile, Genre } from "@/types";

interface DJsPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
  }>;
}

async function DJGrid({
  q,
  genre,
}: {
  q: string | undefined;
  genre: Genre | undefined;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("dj_profiles")
    .select("*")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
  }

  if (genre) {
    query = query.contains("genres", [genre]);
  }

  const { data, error } = await query.returns<DJProfile[]>();

  if (error) {
    return (
      <p className="text-center text-white/50 py-16">
        Something went wrong loading DJs. Please try again.
      </p>
    );
  }

  const profiles = data ?? [];

  if (profiles.length === 0) {
    const hasFilters = q || genre;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl mb-4">🎧</span>
        <p className="text-lg font-medium text-white/70">
          {hasFilters
            ? "No DJs found matching your search"
            : "No DJs have joined yet. Be the first!"}
        </p>
        {hasFilters && (
          <p className="mt-2 text-sm text-white/40">
            Try adjusting your filters or search term.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <DJCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}

export default async function DJsPage({ searchParams }: DJsPageProps) {
  const { q, genre } = await searchParams;

  const validGenre =
    genre && (GENRES as readonly string[]).includes(genre)
      ? (genre as Genre)
      : undefined;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Browse DJs
          </h1>
          <p className="mt-2 text-white/50">
            Discover underground talent for your next event.
          </p>
        </div>

        {/* Search + Filters — wrapped in Suspense because they use useSearchParams */}
        <div className="mb-8 space-y-4">
          <Suspense
            fallback={
              <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
            }
          >
            <SearchInput />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-9 rounded-full bg-white/5 animate-pulse" />
            }
          >
            <GenreFilter />
          </Suspense>
        </div>

        {/* Active filter summary */}
        {(q || validGenre) && (
          <p className="mb-6 text-sm text-white/40">
            Filtering by
            {q && (
              <>
                {" "}
                name/location:{" "}
                <span className="text-white/70">&ldquo;{q}&rdquo;</span>
              </>
            )}
            {q && validGenre && " and"}
            {validGenre && (
              <>
                {" "}
                genre: <span className="text-white/70">{validGenre}</span>
              </>
            )}
          </p>
        )}

        {/* DJ Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <DJGrid q={q} genre={validGenre} />
        </Suspense>
      </div>
    </main>
  );
}
