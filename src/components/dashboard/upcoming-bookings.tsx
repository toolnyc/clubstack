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
    <Card className="dashboard__upcoming">
      <CardHeader>
        <h2 className="dashboard__section-title">Upcoming bookings</h2>
        <Link href="/bookings" className="dashboard__view-all">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="dashboard__empty-text">
            No bookings in the next 7 days.
          </p>
        ) : (
          <ul className="dashboard__booking-list">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="dashboard__booking-item"
                >
                  <div className="dashboard__booking-header">
                    <Badge
                      variant={STATUS_VARIANTS[booking.status] ?? "default"}
                    >
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </Badge>
                    <span className="dashboard__booking-date">
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
                  <div className="dashboard__booking-details">
                    {booking.artists.length > 0 && (
                      <span className="dashboard__booking-artists">
                        {booking.artists.map((a) => a.name).join(", ")}
                      </span>
                    )}
                    {booking.venue_name && (
                      <span className="dashboard__booking-venue">
                        {booking.venue_name}
                      </span>
                    )}
                    {booking.dates[0]?.event_name && (
                      <span className="dashboard__booking-event">
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
