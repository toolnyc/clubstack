"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AutoIcon } from "@/components/ui/auto-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toDateString, isToday } from "@/lib/calendar/utils";
import { getRosterAvailability } from "@/lib/agency/availability";
import type { ArtistAvailability } from "@/lib/agency/availability";
import type { RosterEntry } from "@/types";

interface AvailabilityGridProps {
  initialData: ArtistAvailability[];
  onArtistClick?: (entry: RosterEntry) => void;
  className?: string;
}

const VISIBLE_DAYS = 14;

function getDatesInRange(start: Date, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function AvailabilityGrid({
  initialData,
  onArtistClick,
  className = "",
}: AvailabilityGridProps) {
  const [startDate, setStartDate] = useState(new Date());
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [feeMin, setFeeMin] = useState("");
  const [feeMax, setFeeMax] = useState("");

  const dates = getDatesInRange(startDate, VISIBLE_DAYS);

  async function fetchData(start: Date, min?: string, max?: string) {
    setLoading(true);
    const end = new Date(start);
    end.setDate(end.getDate() + VISIBLE_DAYS - 1);

    const result = await getRosterAvailability(
      toDateString(start),
      toDateString(end),
      min ? Number(min) : undefined,
      max ? Number(max) : undefined
    );
    setData(result);
    setLoading(false);
  }

  function handlePrev() {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    setStartDate(newStart);
    fetchData(newStart, feeMin, feeMax);
  }

  function handleNext() {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    setStartDate(newStart);
    fetchData(newStart, feeMin, feeMax);
  }

  function handleFilter() {
    fetchData(startDate, feeMin, feeMax);
  }

  function getStatusForDate(
    artist: ArtistAvailability,
    dateStr: string
  ): string | null {
    const day = artist.days.find((d) => d.date === dateStr);
    return day?.status ?? null;
  }

  return (
    <div className={`avail-grid ${className}`}>
      <div className="avail-grid__controls">
        <div className="avail-grid__nav">
          <button
            type="button"
            className="avail-grid__nav-btn"
            onClick={handlePrev}
            aria-label="Previous week"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <span className="avail-grid__range">
            {formatShortDate(dates[0])} –{" "}
            {formatShortDate(dates[dates.length - 1])}
          </span>
          <button
            type="button"
            className="avail-grid__nav-btn"
            onClick={handleNext}
            aria-label="Next week"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="avail-grid__filters">
          <Input
            label="Min fee"
            type="number"
            value={feeMin}
            onChange={(e) => setFeeMin(e.target.value)}
            placeholder="$0"
            optional
          />
          <Input
            label="Max fee"
            type="number"
            value={feeMax}
            onChange={(e) => setFeeMax(e.target.value)}
            placeholder="$10,000"
            optional
          />
          <Button variant="ghost" size="sm" onClick={handleFilter}>
            Filter
          </Button>
        </div>
      </div>

      <div
        className="avail-grid__table"
        role="grid"
        aria-label="Artist availability"
        aria-busy={loading}
      >
        <div className="avail-grid__header-row">
          <div className="avail-grid__artist-col avail-grid__header-cell">
            Artist
          </div>
          {dates.map((date) => {
            const dateStr = toDateString(date);
            const today = isToday(date);
            return (
              <div
                key={dateStr}
                className={`avail-grid__date-col avail-grid__header-cell ${today ? "avail-grid__date-col--today" : ""}`}
              >
                <span className="avail-grid__weekday">
                  {formatWeekday(date)}
                </span>
                <span className="avail-grid__date-num">{date.getDate()}</span>
              </div>
            );
          })}
        </div>

        {data.length === 0 && (
          <div className="avail-grid__empty">
            {loading ? "Loading..." : "No artists match your filters"}
          </div>
        )}

        {data.map((artist) => {
          const dj = artist.entry.dj_profile;
          return (
            <div key={artist.entry.id} className="avail-grid__row">
              <button
                type="button"
                className="avail-grid__artist-col avail-grid__artist-cell"
                onClick={() => onArtistClick?.(artist.entry)}
              >
                <AutoIcon name={dj.name} size={28} />
                <span className="avail-grid__artist-name">{dj.name}</span>
              </button>
              {dates.map((date) => {
                const dateStr = toDateString(date);
                const status = getStatusForDate(artist, dateStr);
                const today = isToday(date);
                return (
                  <div
                    key={dateStr}
                    className={`avail-grid__cell ${today ? "avail-grid__cell--today" : ""}`}
                  >
                    {status ? (
                      <span
                        className={`avail-grid__dot avail-grid__dot--${status}`}
                        aria-label={status}
                      />
                    ) : (
                      <span
                        className="avail-grid__dot avail-grid__dot--available"
                        aria-label="available"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { AvailabilityGrid };
export type { AvailabilityGridProps };
