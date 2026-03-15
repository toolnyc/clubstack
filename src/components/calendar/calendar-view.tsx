"use client";

import { useBreakpoint } from "@/lib/hooks/use-breakpoint";
import { MonthGrid } from "./month-grid";
import { AgendaList } from "./agenda-list";
import type { DayStatus } from "./month-grid";
import type { AgendaEvent } from "./agenda-list";

interface CalendarViewProps {
  statuses?: DayStatus[];
  events?: AgendaEvent[];
  className?: string;
}

function CalendarView({
  statuses = [],
  events = [],
  className = "",
}: CalendarViewProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  if (isMobile) {
    return <AgendaList events={events} className={className} />;
  }

  return <MonthGrid statuses={statuses} className={className} />;
}

export { CalendarView };
export type { CalendarViewProps };
