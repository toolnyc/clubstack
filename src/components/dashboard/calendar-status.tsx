import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";

interface CalendarStatusProps {
  connected: boolean;
  calendarId: string | null;
}

function CalendarStatus({ connected, calendarId }: CalendarStatusProps) {
  return (
    <Card className="bg-bg-secondary border border-border-primary rounded-lg p-4">
      <CardHeader className="pb-3">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-text-primary">
          Calendar
        </h2>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="flex flex-col gap-2">
            <StatusDot status="available" label="Connected" />
            {calendarId && (
              <span className="font-mono text-xs text-text-tertiary truncate">
                {calendarId}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <StatusDot status="error" label="Not connected" />
            <Link
              href="/settings"
              className="font-mono text-sm text-accent-cyan hover:text-accent-cyan-hover"
            >
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
