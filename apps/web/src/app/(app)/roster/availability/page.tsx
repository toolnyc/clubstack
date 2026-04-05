import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { getRosterAvailability } from "@/lib/agency/availability";
import { toDateString } from "@/lib/calendar/utils";
import { AvailabilityGrid } from "@/components/agency/availability-grid";

export default async function AvailabilityPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "agency") redirect("/dashboard");

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 13);

  const data = await getRosterAvailability(
    toDateString(today),
    toDateString(end)
  );

  return (
    <div className="roster-page">
      <div className="roster-page__header">
        <h1 className="roster-page__title">Availability</h1>
      </div>
      <AvailabilityGrid initialData={data} />
    </div>
  );
}
