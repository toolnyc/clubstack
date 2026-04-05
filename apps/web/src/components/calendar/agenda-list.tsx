"use client";

import { formatDateShort, formatDateLong } from "@/lib/calendar/utils";
import type { StatusType } from "@/components/ui/status-dot";

interface AgendaEvent {
  date: string;
  status: StatusType;
  title?: string;
  time?: string;
  fee?: string;
}

interface AgendaListProps {
  events: AgendaEvent[];
  className?: string;
}

function groupByDate(events: AgendaEvent[]): Map<string, AgendaEvent[]> {
  const groups = new Map<string, AgendaEvent[]>();
  for (const event of events) {
    const existing = groups.get(event.date) || [];
    existing.push(event);
    groups.set(event.date, existing);
  }
  return groups;
}

function AgendaList({ events, className = "" }: AgendaListProps) {
  const grouped = groupByDate(events);

  if (events.length === 0) {
    return (
      <div className={`agenda-list agenda-list--empty ${className}`}>
        <p className="agenda-list__empty-text">No events to show</p>
      </div>
    );
  }

  return (
    <div className={`agenda-list ${className}`}>
      {Array.from(grouped.entries()).map(([dateStr, dayEvents]) => {
        const date = new Date(dateStr + "T12:00:00");

        return (
          <div key={dateStr} className="agenda-list__group">
            <div className="agenda-list__date-header">
              <span className="agenda-list__date-short">
                {formatDateShort(date)}
              </span>
              <span className="agenda-list__date-long">
                {formatDateLong(date)}
              </span>
            </div>
            {dayEvents.map((event, idx) => (
              <div key={idx} className="agenda-list__event">
                <span
                  className={`agenda-list__dot agenda-list__dot--${event.status}`}
                  aria-hidden="true"
                />
                <div className="agenda-list__event-info">
                  <span className="agenda-list__event-title">
                    {event.title ||
                      event.status.charAt(0).toUpperCase() +
                        event.status.slice(1)}
                  </span>
                  {event.time && (
                    <span className="agenda-list__event-time">
                      {event.time}
                    </span>
                  )}
                </div>
                {event.fee && (
                  <span className="agenda-list__event-fee">{event.fee}</span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export { AgendaList };
export type { AgendaListProps, AgendaEvent };
