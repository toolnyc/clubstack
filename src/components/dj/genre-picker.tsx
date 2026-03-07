"use client";

import { GENRES, Genre } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GenrePickerProps {
  selectedGenres: Genre[];
  onGenresChange: (genres: Genre[]) => void;
}

export function GenrePicker({ selectedGenres, onGenresChange }: GenrePickerProps) {
  function toggleGenre(genre: Genre) {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {GENRES.map((genre) => {
        const isSelected = selectedGenres.includes(genre);
        return (
          <button
            key={genre}
            type="button"
            onClick={() => toggleGenre(genre)}
            className={cn(
              "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 rounded-full"
            )}
          >
            <Badge
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer transition-colors"
            >
              {genre}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
