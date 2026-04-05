"use client";

import { useState, useTransition } from "react";
import type { TravelType, BookingTravel } from "@/types";
import {
  addTravel,
  updateTravel,
  removeTravel,
} from "@/lib/booking/travel-actions";

interface TravelFormProps {
  bookingId: string;
  existing?: BookingTravel | null;
  onSaved?: (travel: BookingTravel) => void;
  onRemoved?: (id: string) => void;
  onCancel?: () => void;
  className?: string;
}

const TRAVEL_TABS: { value: TravelType; label: string }[] = [
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "ground_transport", label: "Ground Transport" },
];

export function TravelForm({
  bookingId,
  existing,
  onSaved,
  onRemoved,
  onCancel,
  className = "",
}: TravelFormProps) {
  const [activeTab, setActiveTab] = useState<TravelType>(
    existing?.type ?? "flight"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Flight fields
  const [airline, setAirline] = useState(existing?.airline ?? "");
  const [flightNumber, setFlightNumber] = useState(
    existing?.flight_number ?? ""
  );
  const [departureAirport, setDepartureAirport] = useState(
    existing?.departure_airport ?? ""
  );
  const [arrivalAirport, setArrivalAirport] = useState(
    existing?.arrival_airport ?? ""
  );
  const [departureTime, setDepartureTime] = useState(
    existing?.departure_time ?? ""
  );
  const [arrivalTime, setArrivalTime] = useState(existing?.arrival_time ?? "");

  // Hotel fields
  const [hotelName, setHotelName] = useState(existing?.hotel_name ?? "");
  const [hotelAddress, setHotelAddress] = useState(
    existing?.hotel_address ?? ""
  );
  const [checkIn, setCheckIn] = useState(existing?.check_in ?? "");
  const [checkOut, setCheckOut] = useState(existing?.check_out ?? "");

  // Ground transport fields
  const [transportDetails, setTransportDetails] = useState(
    existing?.transport_details ?? ""
  );

  // Common fields
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [cost, setCost] = useState(existing?.cost?.toString() ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const costNum = cost ? parseFloat(cost) : undefined;

      if (existing) {
        const updates: Record<string, unknown> = {
          type: activeTab,
          notes: notes || null,
          cost: costNum ?? null,
          // Reset all type-specific fields
          airline: null,
          flight_number: null,
          departure_airport: null,
          arrival_airport: null,
          departure_time: null,
          arrival_time: null,
          hotel_name: null,
          hotel_address: null,
          check_in: null,
          check_out: null,
          transport_details: null,
        };

        if (activeTab === "flight") {
          updates.airline = airline || null;
          updates.flight_number = flightNumber || null;
          updates.departure_airport = departureAirport || null;
          updates.arrival_airport = arrivalAirport || null;
          updates.departure_time = departureTime || null;
          updates.arrival_time = arrivalTime || null;
        } else if (activeTab === "hotel") {
          updates.hotel_name = hotelName || null;
          updates.hotel_address = hotelAddress || null;
          updates.check_in = checkIn || null;
          updates.check_out = checkOut || null;
        } else {
          updates.transport_details = transportDetails || null;
        }

        const result = await updateTravel(existing.id, updates);
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          onSaved?.(result.data);
        }
      } else {
        let input: Parameters<typeof addTravel>[1];

        if (activeTab === "flight") {
          input = {
            type: "flight",
            airline: airline || undefined,
            flight_number: flightNumber || undefined,
            departure_airport: departureAirport || undefined,
            arrival_airport: arrivalAirport || undefined,
            departure_time: departureTime || undefined,
            arrival_time: arrivalTime || undefined,
            notes: notes || undefined,
            cost: costNum,
          };
        } else if (activeTab === "hotel") {
          input = {
            type: "hotel",
            hotel_name: hotelName || undefined,
            hotel_address: hotelAddress || undefined,
            check_in: checkIn || undefined,
            check_out: checkOut || undefined,
            notes: notes || undefined,
            cost: costNum,
          };
        } else {
          input = {
            type: "ground_transport",
            transport_details: transportDetails || undefined,
            notes: notes || undefined,
            cost: costNum,
          };
        }

        const result = await addTravel(bookingId, input);
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          onSaved?.(result.data);
        }
      }
    });
  }

  function handleRemove() {
    if (!existing) return;
    startTransition(async () => {
      const result = await removeTravel(existing.id);
      if (result.error) {
        setError(result.error);
      } else {
        onRemoved?.(existing.id);
      }
    });
  }

  return (
    <form
      className={`travel-form ${className}`}
      onSubmit={handleSubmit}
      data-testid="travel-form"
    >
      <div className="travel-form__tabs" role="tablist">
        {TRAVEL_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`travel-form__tab ${
              activeTab === tab.value ? "travel-form__tab--active" : ""
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="travel-form__fields" role="tabpanel">
        {activeTab === "flight" && (
          <>
            <div className="travel-form__row">
              <label className="travel-form__label">
                Airline
                <input
                  type="text"
                  className="travel-form__input"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  placeholder="e.g. Delta"
                />
              </label>
              <label className="travel-form__label">
                Flight number
                <input
                  type="text"
                  className="travel-form__input"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g. DL 1234"
                />
              </label>
            </div>
            <div className="travel-form__row">
              <label className="travel-form__label">
                Departure airport
                <input
                  type="text"
                  className="travel-form__input"
                  value={departureAirport}
                  onChange={(e) => setDepartureAirport(e.target.value)}
                  placeholder="e.g. JFK"
                />
              </label>
              <label className="travel-form__label">
                Arrival airport
                <input
                  type="text"
                  className="travel-form__input"
                  value={arrivalAirport}
                  onChange={(e) => setArrivalAirport(e.target.value)}
                  placeholder="e.g. LAX"
                />
              </label>
            </div>
            <div className="travel-form__row">
              <label className="travel-form__label">
                Departure time
                <input
                  type="datetime-local"
                  className="travel-form__input"
                  value={departureTime ? departureTime.slice(0, 16) : ""}
                  onChange={(e) =>
                    setDepartureTime(
                      e.target.value ? `${e.target.value}:00Z` : ""
                    )
                  }
                />
              </label>
              <label className="travel-form__label">
                Arrival time
                <input
                  type="datetime-local"
                  className="travel-form__input"
                  value={arrivalTime ? arrivalTime.slice(0, 16) : ""}
                  onChange={(e) =>
                    setArrivalTime(
                      e.target.value ? `${e.target.value}:00Z` : ""
                    )
                  }
                />
              </label>
            </div>
          </>
        )}

        {activeTab === "hotel" && (
          <>
            <label className="travel-form__label">
              Hotel name
              <input
                type="text"
                className="travel-form__input"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g. Ace Hotel"
              />
            </label>
            <label className="travel-form__label">
              Address
              <input
                type="text"
                className="travel-form__input"
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                placeholder="e.g. 20 W 29th St, New York"
              />
            </label>
            <div className="travel-form__row">
              <label className="travel-form__label">
                Check-in
                <input
                  type="date"
                  className="travel-form__input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </label>
              <label className="travel-form__label">
                Check-out
                <input
                  type="date"
                  className="travel-form__input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </label>
            </div>
          </>
        )}

        {activeTab === "ground_transport" && (
          <label className="travel-form__label">
            Transport details
            <textarea
              className="travel-form__input travel-form__textarea"
              value={transportDetails}
              onChange={(e) => setTransportDetails(e.target.value)}
              placeholder="e.g. Car service from LAX to venue, 8pm pickup"
              rows={3}
            />
          </label>
        )}

        {/* Common fields */}
        <div className="travel-form__row">
          <label className="travel-form__label travel-form__label--cost">
            Cost
            <input
              type="number"
              className="travel-form__input"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </label>
          <label className="travel-form__label travel-form__label--notes">
            Notes
            <input
              type="text"
              className="travel-form__input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="travel-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="travel-form__actions">
        {existing && (
          <button
            type="button"
            className="btn btn--ghost btn--sm travel-form__remove-btn"
            onClick={handleRemove}
            disabled={isPending}
          >
            Remove
          </button>
        )}
        <div className="travel-form__actions-right">
          {onCancel && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={isPending}
          >
            {isPending ? "Saving..." : existing ? "Update" : "Add travel"}
          </button>
        </div>
      </div>
    </form>
  );
}
