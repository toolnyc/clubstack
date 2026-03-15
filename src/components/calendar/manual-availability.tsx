"use client";

import { useState, useTransition } from "react";
import { CalendarOff, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  setWeeklyAvailability,
  blockDate,
  unblockDate,
  importICS,
} from "@/lib/calendar/manual-actions";
import type { ManualAvailability } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface WeeklyEntry {
  day_of_week: number;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface ManualAvailabilityProps {
  initialData: ManualAvailability[];
  className?: string;
}

function buildWeeklyDefaults(
  data: ManualAvailability[]
): Map<number, WeeklyEntry> {
  const map = new Map<number, WeeklyEntry>();
  for (const row of data) {
    if (row.day_of_week !== null) {
      map.set(row.day_of_week, {
        day_of_week: row.day_of_week,
        is_available: row.is_available,
        start_time: row.start_time,
        end_time: row.end_time,
      });
    }
  }
  return map;
}

function getBlockedDates(data: ManualAvailability[]): string[] {
  return data
    .filter((row) => row.specific_date !== null && !row.is_available)
    .map((row) => row.specific_date as string);
}

function ManualAvailabilityEditor({
  initialData,
  className = "",
}: ManualAvailabilityProps) {
  const weeklyDefaults = buildWeeklyDefaults(initialData);

  const [weekly, setWeekly] = useState<Map<number, WeeklyEntry>>(() => {
    const map = new Map<number, WeeklyEntry>();
    for (let i = 0; i < 7; i++) {
      map.set(
        i,
        weeklyDefaults.get(i) ?? {
          day_of_week: i,
          is_available: true,
          start_time: null,
          end_time: null,
        }
      );
    }
    return map;
  });

  const [blockedDates, setBlockedDates] = useState<string[]>(() =>
    getBlockedDates(initialData)
  );
  const [blockDateInput, setBlockDateInput] = useState("");
  const [icsText, setIcsText] = useState("");
  const [icsResult, setIcsResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleDay(dayIndex: number) {
    setWeekly((prev) => {
      const next = new Map(prev);
      const current = next.get(dayIndex);
      if (current) {
        next.set(dayIndex, {
          ...current,
          is_available: !current.is_available,
        });
      }
      return next;
    });
  }

  function updateTime(
    dayIndex: number,
    field: "start_time" | "end_time",
    value: string
  ) {
    setWeekly((prev) => {
      const next = new Map(prev);
      const current = next.get(dayIndex);
      if (current) {
        next.set(dayIndex, {
          ...current,
          [field]: value || null,
        });
      }
      return next;
    });
  }

  function handleSaveWeekly() {
    setError(null);
    const entries = Array.from(weekly.values());
    startTransition(async () => {
      const result = await setWeeklyAvailability(entries);
      if (result.error) setError(result.error);
    });
  }

  function handleBlockDate() {
    if (!blockDateInput) return;
    setError(null);
    startTransition(async () => {
      const result = await blockDate({ date: blockDateInput });
      if (result.error) {
        setError(result.error);
      } else {
        setBlockedDates((prev) =>
          prev.includes(blockDateInput)
            ? prev
            : [...prev, blockDateInput].sort()
        );
        setBlockDateInput("");
      }
    });
  }

  function handleUnblockDate(date: string) {
    setError(null);
    startTransition(async () => {
      const result = await unblockDate({ date });
      if (result.error) {
        setError(result.error);
      } else {
        setBlockedDates((prev) => prev.filter((d) => d !== date));
      }
    });
  }

  function handleImportICS() {
    if (!icsText.trim()) return;
    setError(null);
    setIcsResult(null);
    startTransition(async () => {
      const result = await importICS({ icsText });
      if (result.error) {
        setError(result.error);
      } else {
        setIcsResult(`Imported ${result.imported} date(s) as blocked`);
        setIcsText("");
      }
    });
  }

  return (
    <div className={`manual-avail ${className}`}>
      {/* Weekly availability grid */}
      <section className="manual-avail__section">
        <h3 className="manual-avail__heading">Weekly availability</h3>
        <p className="manual-avail__desc">
          Toggle days you are generally available
        </p>

        <div
          className="manual-avail__week-grid"
          role="group"
          aria-label="Weekly availability"
        >
          {WEEKDAYS.map((label, idx) => {
            const entry = weekly.get(idx);
            const available = entry?.is_available ?? true;

            return (
              <div key={label} className="manual-avail__day">
                <button
                  type="button"
                  className={`manual-avail__day-toggle${available ? " manual-avail__day-toggle--active" : ""}`}
                  onClick={() => toggleDay(idx)}
                  aria-pressed={available}
                  aria-label={`${label}: ${available ? "available" : "unavailable"}`}
                >
                  {label}
                </button>

                {available && (
                  <div className="manual-avail__time-range">
                    <input
                      type="time"
                      className="manual-avail__time-input"
                      value={entry?.start_time ?? ""}
                      onChange={(e) =>
                        updateTime(idx, "start_time", e.target.value)
                      }
                      aria-label={`${label} start time`}
                    />
                    <span className="manual-avail__time-sep">&ndash;</span>
                    <input
                      type="time"
                      className="manual-avail__time-input"
                      value={entry?.end_time ?? ""}
                      onChange={(e) =>
                        updateTime(idx, "end_time", e.target.value)
                      }
                      aria-label={`${label} end time`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveWeekly}
          loading={isPending}
        >
          <Check size={16} strokeWidth={1.5} />
          Save weekly
        </Button>
      </section>

      {/* Block specific dates */}
      <section className="manual-avail__section">
        <h3 className="manual-avail__heading">Blocked dates</h3>
        <p className="manual-avail__desc">Mark specific dates as unavailable</p>

        <div className="manual-avail__block-row">
          <input
            type="date"
            className="manual-avail__date-input"
            value={blockDateInput}
            onChange={(e) => setBlockDateInput(e.target.value)}
            aria-label="Date to block"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBlockDate}
            loading={isPending}
            disabled={!blockDateInput}
          >
            <CalendarOff size={16} strokeWidth={1.5} />
            Block
          </Button>
        </div>

        {blockedDates.length > 0 && (
          <ul className="manual-avail__blocked-list">
            {blockedDates.map((date) => (
              <li key={date} className="manual-avail__blocked-item">
                <span className="manual-avail__blocked-date">{date}</span>
                <button
                  type="button"
                  className="manual-avail__unblock-btn"
                  onClick={() => handleUnblockDate(date)}
                  aria-label={`Unblock ${date}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ICS import */}
      <section className="manual-avail__section">
        <h3 className="manual-avail__heading">Import from calendar</h3>
        <p className="manual-avail__desc">
          Paste an ICS calendar export or subscription URL content
        </p>

        <textarea
          className="manual-avail__ics-input"
          rows={6}
          placeholder={"BEGIN:VCALENDAR\n..."}
          value={icsText}
          onChange={(e) => setIcsText(e.target.value)}
          aria-label="ICS calendar data"
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={handleImportICS}
          loading={isPending}
          disabled={!icsText.trim()}
        >
          <Upload size={16} strokeWidth={1.5} />
          Import ICS
        </Button>

        {icsResult && <p className="manual-avail__ics-result">{icsResult}</p>}
      </section>

      {error && (
        <p className="manual-avail__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { ManualAvailabilityEditor };
export type { ManualAvailabilityProps };
