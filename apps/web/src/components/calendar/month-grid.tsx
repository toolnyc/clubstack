"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getMonthGridDays,
  formatMonthYear,
  toDateString,
  isToday,
  isSameMonth,
} from "@/lib/calendar/utils";
import type { StatusType } from "@/components/ui/status-dot";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayStatus {
  date: string;
  status: StatusType;
}

interface MonthGridProps {
  statuses?: DayStatus[];
  onDayClick?: (date: string) => void;
  selectedDate?: string;
  className?: string;
}

function MonthGrid({
  statuses = [],
  onDayClick,
  selectedDate,
  className = "",
}: MonthGridProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = getMonthGridDays(year, month);
  const statusMap = new Map(statuses.map((s) => [s.date, s.status]));

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function handleKeyDown(e: React.KeyboardEvent, dateStr: string, idx: number) {
    let newIdx = idx;
    switch (e.key) {
      case "ArrowLeft":
        newIdx = idx - 1;
        break;
      case "ArrowRight":
        newIdx = idx + 1;
        break;
      case "ArrowUp":
        newIdx = idx - 7;
        break;
      case "ArrowDown":
        newIdx = idx + 7;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onDayClick?.(dateStr);
        return;
      default:
        return;
    }

    e.preventDefault();
    const cells = document.querySelectorAll<HTMLElement>(".month-grid__day");
    if (newIdx >= 0 && newIdx < cells.length) {
      cells[newIdx].focus();
    }
  }

  return (
    <div className={`month-grid ${className}`}>
      <div className="month-grid__header">
        <button
          type="button"
          onClick={prevMonth}
          className="month-grid__nav"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <span className="month-grid__title">{formatMonthYear(viewDate)}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="month-grid__nav"
          aria-label="Next month"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="month-grid__weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="month-grid__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="month-grid__days" role="grid" aria-label="Calendar">
        {days.map((date, idx) => {
          const dateStr = toDateString(date);
          const status = statusMap.get(dateStr);
          const today = isToday(date);
          const inMonth = isSameMonth(date, month);
          const selected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              className={`month-grid__day${today ? " month-grid__day--today" : ""}${!inMonth ? " month-grid__day--outside" : ""}${selected ? " month-grid__day--selected" : ""}`}
              onClick={() => onDayClick?.(dateStr)}
              onKeyDown={(e) => handleKeyDown(e, dateStr, idx)}
              tabIndex={idx === 0 ? 0 : -1}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${status ? `, ${status}` : ""}`}
            >
              <span className="month-grid__day-number">{date.getDate()}</span>
              {status && (
                <span
                  className={`month-grid__dot month-grid__dot--${status}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { MonthGrid };
export type { MonthGridProps, DayStatus };
