import { getCalendarConnection } from "@/lib/calendar/actions";
import { TopBar } from "@/components/layout/top-bar";
import { CalendarConnect } from "@/components/calendar/calendar-connect";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const connection = await getCalendarConnection();

  return (
    <>
      <TopBar title="Calendar" />
      <div className="calendar-page">
        <CalendarConnect
          connected={!!connection}
          connectedSince={connection?.created_at}
        />
        <CalendarView />
      </div>
    </>
  );
}
