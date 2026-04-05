import { getCalendarConnection, getAvailability } from "@/lib/calendar/actions";
import { TopBar } from "@/components/layout/top-bar";
import { CalendarConnect } from "@/components/calendar/calendar-connect";
import { CalendarView } from "@/components/calendar/calendar-view";
import { createClient } from "@/lib/supabase/server";
import type { StatusType } from "@/components/ui/status-dot";

export default async function CalendarPage() {
  const connection = await getCalendarConnection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch availability data for the current month + next month
  let statuses: { date: string; status: StatusType }[] = [];
  if (user && connection) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      .toISOString()
      .split("T")[0];
    const availability = await getAvailability(user.id, startDate, endDate);
    statuses = availability.map((d) => ({
      date: d.date,
      status: d.status as StatusType,
    }));
  }

  // Fetch booked dates to overlay on the calendar
  let bookedDates: { date: string; status: "booked" }[] = [];
  if (user) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      .toISOString()
      .split("T")[0];

    const { data: bookingDates } = await supabase
      .from("booking_dates")
      .select("date, booking:bookings!inner(created_by, status)")
      .gte("date", startDate)
      .lte("date", endDate);

    if (bookingDates) {
      bookedDates = bookingDates
        .filter((bd) => {
          const booking = bd.booking as unknown as {
            created_by: string;
            status: string;
          };
          return (
            booking.created_by === user.id && booking.status !== "cancelled"
          );
        })
        .map((bd) => ({
          date: bd.date,
          status: "booked" as const,
        }));
    }
  }

  // Merge: booked takes precedence over busy
  const bookedDateSet = new Set(bookedDates.map((d) => d.date));
  const mergedStatuses = [
    ...bookedDates,
    ...statuses.filter((s) => !bookedDateSet.has(s.date)),
  ];

  // Build agenda events from merged statuses
  const events = mergedStatuses.map((s) => ({
    date: s.date,
    status: s.status,
  }));

  return (
    <>
      <TopBar title="Calendar" />
      <div className="calendar-page">
        <div className="animate-fade-in-up">
          <CalendarConnect
            connected={!!connection}
            connectedSince={connection?.created_at}
            syncStatus={connection?.sync_status ?? undefined}
            lastSyncedAt={connection?.last_synced_at ?? undefined}
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <CalendarView statuses={mergedStatuses} events={events} />
        </div>
      </div>
    </>
  );
}
