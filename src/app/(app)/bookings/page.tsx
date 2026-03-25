import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth/actions";
import { getBookings } from "@/lib/booking/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";

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
    <>
      <TopBar
        title="Bookings"
        actions={
          <Link href="/bookings/new">
            <Button variant="primary" size="sm">
              New booking
            </Button>
          </Link>
        }
      />
      <div className="flex flex-col gap-6 p-6">
        {bookings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-body text-sm text-text-tertiary">
              No bookings yet. Create your first booking to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="flex flex-col gap-2 py-4 border-b border-border-secondary hover:bg-bg-tertiary transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANTS[booking.status] ?? "default"}>
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </Badge>
                  <span className="font-mono text-sm text-text-tertiary">
                    {new Date(booking.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {booking.notes && (
                  <p className="font-body text-sm text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
                    {booking.notes}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
