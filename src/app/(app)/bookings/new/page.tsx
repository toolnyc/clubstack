import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { getVenues } from "@/lib/venue/actions";
import { getPromoters } from "@/lib/promoter/actions";
import { getRoster } from "@/lib/agency/actions";
import { TopBar } from "@/components/layout/top-bar";
import { BookingForm } from "@/components/booking/booking-form";

export default async function NewBookingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const [venues, promoters, roster] = await Promise.all([
    getVenues(),
    getPromoters(),
    getRoster(),
  ]);

  return (
    <>
      <TopBar title="New Booking" />
      <div className="new-booking-page">
        <BookingForm venues={venues} promoters={promoters} roster={roster} />
      </div>
    </>
  );
}
