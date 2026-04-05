import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";

interface CalendarStatusProps {
  connected: boolean;
  calendarId: string | null;
}

function CalendarStatus({ connected, calendarId }: CalendarStatusProps) {
  return (
    <Card className="dashboard__calendar">
      <CardHeader>
        <h2 className="dashboard__section-title">Calendar</h2>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="dashboard__calendar-connected">
            <StatusDot status="available" label="Connected" />
            {calendarId && (
              <span className="dashboard__calendar-id">{calendarId}</span>
            )}
          </div>
        ) : (
          <div className="dashboard__calendar-disconnected">
            <StatusDot status="error" label="Not connected" />
            <Link href="/settings" className="dashboard__calendar-link">
              Connect Google Calendar
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { CalendarStatus };
export type { CalendarStatusProps };
