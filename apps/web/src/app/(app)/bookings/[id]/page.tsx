import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { getBooking } from "@/lib/booking/actions";
import { getInvoiceByBookingId } from "@/lib/invoice/actions";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/top-bar";
import { GenerateInvoiceButton } from "@/components/invoice/generate-invoice-button";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "default" | "cyan" | "neon" | "error"> = {
  draft: "default",
  contract_sent: "cyan",
  signed: "cyan",
  deposit_paid: "neon",
  balance_paid: "neon",
  completed: "neon",
  cancelled: "error",
};

const INVOICE_ELIGIBLE_STATUSES = new Set([
  "signed",
  "deposit_paid",
  "balance_paid",
  "completed",
]);

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const data = await getBooking(id);

  if (!data) {
    return (
      <>
        <TopBar title="Booking" />
        <div className="booking-detail">
          <h1 className="booking-detail__title">Booking not found</h1>
        </div>
      </>
    );
  }

  const existingInvoice = await getInvoiceByBookingId(id);
  const canGenerateInvoice =
    INVOICE_ELIGIBLE_STATUSES.has(data.booking.status) && !existingInvoice;

  return (
    <>
      <TopBar title="Booking" />
      <div className="booking-detail">
        <div className="booking-detail__header">
          <h1 className="booking-detail__title">Booking</h1>
          <Badge variant={STATUS_VARIANTS[data.booking.status] ?? "default"}>
            {data.booking.status}
          </Badge>
        </div>

        {data.booking.notes && (
          <p className="booking-detail__notes">{data.booking.notes}</p>
        )}

        <div className="booking-detail__section">
          <h2 className="booking-detail__section-title">Invoice</h2>
          {existingInvoice ? (
            <Link
              href={`/invoices/${existingInvoice.id}`}
              className="booking-detail__invoice-link"
            >
              View invoice ({existingInvoice.status}) &rarr;
            </Link>
          ) : canGenerateInvoice ? (
            <GenerateInvoiceButton bookingId={id} />
          ) : (
            <p className="booking-detail__invoice-note">
              Invoice can be generated once the contract is signed.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
