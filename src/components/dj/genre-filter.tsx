"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { GENRES } from "@/types";
import { cn } from "@/lib/utils";

export function GenreFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeGenre = searchParams.get("genre");

  function handleGenreClick(genre: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (genre) {
      params.set("genre", genre);
    } else {
      params.delete("genre");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => handleGenreClick(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150",
          !activeGenre
            ? "bg-white text-black"
            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        )}
      >
        All
      </button>

      {GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => handleGenreClick(genre)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150",
            activeGenre === genre
              ? "bg-white text-black"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          )}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
