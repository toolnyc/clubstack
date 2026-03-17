import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { getBooking } from "@/lib/booking/actions";

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
      <div className="booking-detail">
        <h1 className="booking-detail__title">Booking not found</h1>
      </div>
    );
  }

  return (
    <div className="booking-detail">
      <h1 className="booking-detail__title">Booking</h1>
      <p className="booking-detail__status">Status: {data.booking.status}</p>
      {data.booking.notes && (
        <p className="booking-detail__notes">{data.booking.notes}</p>
      )}
    </div>
  );
}
