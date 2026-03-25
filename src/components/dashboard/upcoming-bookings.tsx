import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UpcomingBooking } from "@/lib/dashboard/actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  contract_sent: "Contract Sent",
  signed: "Signed",
  deposit_paid: "Deposit Paid",
  balance_paid: "Balance Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<string, "default" | "cyan" | "neon" | "error"> = {
  draft: "default",
  contract_sent: "cyan",
  signed: "cyan",
  deposit_paid: "neon",
  balance_paid: "neon",
  completed: "neon",
  cancelled: "error",
};

interface UpcomingBookingsProps {
  bookings: UpcomingBooking[];
}

function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  return (
    <Card className="bg-bg-secondary border border-border-primary rounded-lg p-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-text-primary">
          Upcoming bookings
        </h2>
        <Link
          href="/bookings"
          className="font-mono text-sm text-accent-cyan hover:text-accent-cyan-hover"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="font-body text-sm text-text-tertiary">
            No bookings in the next 7 days.
          </p>
        ) : (
          <ul className="flex flex-col">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="block py-3 border-b border-border-secondary hover:bg-bg-tertiary transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={STATUS_VARIANTS[booking.status] ?? "default"}
                    >
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </Badge>
                    <span className="font-mono text-sm text-text-tertiary">
                      {booking.dates
                        .map((d) =>
                          new Date(d.date + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )
                        )
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {booking.artists.length > 0 && (
                      <span className="font-mono text-sm text-text-primary">
                        {booking.artists.map((a) => a.name).join(", ")}
                      </span>
                    )}
                    {booking.venue_name && (
                      <span className="font-body text-sm text-text-secondary">
                        {booking.venue_name}
                      </span>
                    )}
                    {booking.dates[0]?.event_name && (
                      <span className="font-mono text-xs text-text-tertiary">
                        {booking.dates[0].event_name}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { UpcomingBookings };
export type { UpcomingBookingsProps };
