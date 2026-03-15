import type {
  Itinerary,
  BookingTravelEntry,
} from "@/lib/booking/itinerary-actions";

interface ItineraryViewProps {
  itinerary: Itinerary;
  className?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupTravelByType(
  travel: BookingTravelEntry[]
): Record<string, BookingTravelEntry[]> {
  const grouped: Record<string, BookingTravelEntry[]> = {};
  for (const entry of travel) {
    const key = entry.type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }
  return grouped;
}

const TRAVEL_TYPE_LABELS: Record<string, string> = {
  flight: "Flights",
  hotel: "Accommodation",
  ground_transport: "Ground Transport",
};

function ItineraryView({ itinerary, className = "" }: ItineraryViewProps) {
  const { booking, dates, artists, travel, venue, venueContact, promoterName } =
    itinerary;

  const travelByType = groupTravelByType(travel);
  const hasTravel = travel.length > 0;

  return (
    <div className={`itinerary ${className}`}>
      {/* Header */}
      <div className="itinerary__header">
        <h1 className="itinerary__title">Booking Itinerary</h1>
        {booking.status !== "cancelled" && (
          <span className="itinerary__status">{booking.status}</span>
        )}
        {booking.status === "cancelled" && (
          <span className="itinerary__status itinerary__status--cancelled">
            Cancelled
          </span>
        )}
      </div>

      {/* Event Dates */}
      <section className="itinerary__section">
        <h2 className="itinerary__section-title">Event Details</h2>
        <div className="itinerary__dates">
          {dates.map((date) => (
            <div key={date.id} className="itinerary__date-card">
              <div className="itinerary__date-value">
                {formatDate(date.date)}
              </div>
              {date.event_name && (
                <div className="itinerary__date-event">{date.event_name}</div>
              )}
              <div className="itinerary__date-times">
                {date.load_in_time && (
                  <span className="itinerary__time-entry">
                    <span className="itinerary__time-label">Load-in</span>
                    <span className="itinerary__time-value">
                      {formatTime(date.load_in_time)}
                    </span>
                  </span>
                )}
                {date.set_time && (
                  <span className="itinerary__time-entry">
                    <span className="itinerary__time-label">Set time</span>
                    <span className="itinerary__time-value">
                      {formatTime(date.set_time)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Venue Info */}
      {venue && (
        <section className="itinerary__section">
          <h2 className="itinerary__section-title">Venue</h2>
          <div className="itinerary__venue">
            <div className="itinerary__venue-name">{venue.name}</div>
            {venue.address && (
              <div className="itinerary__venue-address">{venue.address}</div>
            )}
            {venue.capacity && (
              <div className="itinerary__venue-capacity">
                Capacity: {venue.capacity.toLocaleString()}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Artist Lineup */}
      <section className="itinerary__section">
        <h2 className="itinerary__section-title">Artist Lineup</h2>
        <div className="itinerary__artists">
          {artists.map((artist) => (
            <div key={artist.id} className="itinerary__artist">
              <span className="itinerary__artist-name">
                {artist.dj_profile?.name ?? "TBA"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Travel Details */}
      {hasTravel && (
        <section className="itinerary__section">
          <h2 className="itinerary__section-title">Travel</h2>
          {Object.entries(travelByType).map(([type, entries]) => (
            <div key={type} className="itinerary__travel-group">
              <h3 className="itinerary__travel-type">
                {TRAVEL_TYPE_LABELS[type] ?? type}
              </h3>
              {entries.map((entry) => (
                <div key={entry.id} className="itinerary__travel-card">
                  <div className="itinerary__travel-description">
                    {entry.description}
                  </div>
                  {entry.confirmation_number && (
                    <div className="itinerary__travel-confirmation">
                      Confirmation: {entry.confirmation_number}
                    </div>
                  )}
                  {(entry.origin || entry.destination) && (
                    <div className="itinerary__travel-route">
                      {entry.origin && (
                        <span className="itinerary__travel-origin">
                          {entry.origin}
                        </span>
                      )}
                      {entry.origin && entry.destination && (
                        <span className="itinerary__travel-arrow">&rarr;</span>
                      )}
                      {entry.destination && (
                        <span className="itinerary__travel-destination">
                          {entry.destination}
                        </span>
                      )}
                    </div>
                  )}
                  {(entry.departure_time || entry.arrival_time) && (
                    <div className="itinerary__travel-times">
                      {entry.departure_time && (
                        <span className="itinerary__time-entry">
                          <span className="itinerary__time-label">Depart</span>
                          <span className="itinerary__time-value">
                            {formatDateTime(entry.departure_time)}
                          </span>
                        </span>
                      )}
                      {entry.arrival_time && (
                        <span className="itinerary__time-entry">
                          <span className="itinerary__time-label">Arrive</span>
                          <span className="itinerary__time-value">
                            {formatDateTime(entry.arrival_time)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  {entry.notes && (
                    <div className="itinerary__travel-notes">{entry.notes}</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* Contact Info */}
      {(venueContact || promoterName) && (
        <section className="itinerary__section">
          <h2 className="itinerary__section-title">Contacts</h2>
          <div className="itinerary__contacts">
            {promoterName && (
              <div className="itinerary__contact">
                <span className="itinerary__contact-role">Promoter</span>
                <span className="itinerary__contact-name">{promoterName}</span>
              </div>
            )}
            {venueContact?.name && (
              <div className="itinerary__contact">
                <span className="itinerary__contact-role">Venue Contact</span>
                <span className="itinerary__contact-name">
                  {venueContact.name}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Notes */}
      {booking.notes && (
        <section className="itinerary__section">
          <h2 className="itinerary__section-title">Notes</h2>
          <p className="itinerary__notes">{booking.notes}</p>
        </section>
      )}
    </div>
  );
}

export { ItineraryView };
export type { ItineraryViewProps };
