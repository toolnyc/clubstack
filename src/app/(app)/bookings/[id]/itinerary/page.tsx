import { redirect } from "next/navigation";
import { getItinerary } from "@/lib/booking/itinerary-actions";
import { ItineraryView } from "@/components/booking/itinerary-view";

interface ItineraryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
  const { id } = await params;
  const { data: itinerary, error } = await getItinerary(id);

  if (error === "Not authenticated") {
    redirect("/login");
  }

  if (!itinerary) {
    return (
      <div className="itinerary-page">
        <div className="itinerary-page__error">
          <h1 className="itinerary-page__error-title">Booking not found</h1>
          <p className="itinerary-page__error-text">
            This booking does not exist or you do not have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="itinerary-page">
      <ItineraryView itinerary={itinerary} />
    </div>
  );
}
