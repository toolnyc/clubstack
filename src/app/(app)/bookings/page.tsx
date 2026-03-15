import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth/actions";
import { getBookings } from "@/lib/booking/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default async function BookingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const bookings = await getBookings();

  return (
    <div className="bookings-page">
      <div className="bookings-page__header">
        <h1 className="bookings-page__title">Bookings</h1>
        <Link href="/bookings/new">
          <Button variant="primary" size="sm">
            New booking
          </Button>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bookings-page__empty">
          <p className="bookings-page__empty-text">
            No bookings yet. Create your first booking to get started.
          </p>
        </div>
      ) : (
        <div className="bookings-page__list">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}`}
              className="bookings-page__item"
            >
              <div className="bookings-page__item-info">
                <Badge variant={STATUS_VARIANTS[booking.status] ?? "default"}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </Badge>
                <span className="bookings-page__item-date">
                  {new Date(booking.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {booking.notes && (
                <p className="bookings-page__item-notes">{booking.notes}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
