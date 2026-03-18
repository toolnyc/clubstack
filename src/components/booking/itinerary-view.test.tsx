import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ItineraryView } from "./itinerary-view";
import { buildItinerary } from "@/test/factories";

describe("ItineraryView", () => {
  it("renders event date and name", () => {
    render(<ItineraryView itinerary={buildItinerary()} />);
    expect(screen.getByText("Friday Residency")).toBeInTheDocument();
    expect(screen.getByText(/April 15, 2026/)).toBeInTheDocument();
  });

  it("renders set time and load-in time", () => {
    render(<ItineraryView itinerary={buildItinerary()} />);
    expect(screen.getByText("11:00 PM")).toBeInTheDocument();
    expect(screen.getByText("8:00 PM")).toBeInTheDocument();
  });

  it("renders venue info with address and capacity", () => {
    render(<ItineraryView itinerary={buildItinerary()} />);
    expect(screen.getByText("Basement Club")).toBeInTheDocument();
    expect(
      screen.getByText("123 Underground Ave, Brooklyn, NY 11201")
    ).toBeInTheDocument();
    expect(screen.getByText("Capacity: 300")).toBeInTheDocument();
  });

  it("renders artist lineup", () => {
    render(<ItineraryView itinerary={buildItinerary()} />);
    expect(screen.getByText("DJ Shadow")).toBeInTheDocument();
  });

  it("renders multiple artists", () => {
    const itinerary = buildItinerary({
      artists: [
        {
          id: "a1",
          booking_id: "b1",
          dj_profile_id: "dj1",
          fee: 1500,
          commission_pct: 15,
          payment_split_pct: 50,
          created_at: "2026-04-01T00:00:00Z",
          dj_profile: { id: "dj1", name: "DJ Alpha", slug: "dj-alpha" },
        },
        {
          id: "a2",
          booking_id: "b1",
          dj_profile_id: "dj2",
          fee: 1000,
          commission_pct: 15,
          payment_split_pct: 50,
          created_at: "2026-04-01T00:00:00Z",
          dj_profile: { id: "dj2", name: "DJ Beta", slug: "dj-beta" },
        },
      ],
    });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
  });

  it("renders TBA for artist without profile", () => {
    const itinerary = buildItinerary({
      artists: [
        {
          id: "a1",
          booking_id: "b1",
          dj_profile_id: "dj1",
          fee: 1500,
          commission_pct: 15,
          payment_split_pct: 100,
          created_at: "2026-04-01T00:00:00Z",
          dj_profile: null,
        },
      ],
    });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("TBA")).toBeInTheDocument();
  });

  it("renders travel details when present", () => {
    const itinerary = buildItinerary({
      travel: [
        {
          id: "t1",
          booking_id: "b1",
          type: "flight",
          description: "Delta DL1234",
          confirmation_number: "ABC123",
          departure_time: "2026-04-14T18:00:00Z",
          arrival_time: "2026-04-14T21:00:00Z",
          origin: "LAX",
          destination: "JFK",
          notes: "Window seat preferred",
          created_at: "2026-04-01T00:00:00Z",
        },
      ],
    });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("Flights")).toBeInTheDocument();
    expect(screen.getByText("Delta DL1234")).toBeInTheDocument();
    expect(screen.getByText("Confirmation: ABC123")).toBeInTheDocument();
    expect(screen.getByText("LAX")).toBeInTheDocument();
    expect(screen.getByText("JFK")).toBeInTheDocument();
    expect(screen.getByText("Window seat preferred")).toBeInTheDocument();
  });

  it("does not render travel section when empty", () => {
    render(<ItineraryView itinerary={buildItinerary()} />);
    expect(screen.queryByText("Travel")).not.toBeInTheDocument();
  });

  it("renders promoter contact", () => {
    const itinerary = buildItinerary({ promoterName: "Mike D" });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("Promoter")).toBeInTheDocument();
    expect(screen.getByText("Mike D")).toBeInTheDocument();
  });

  it("renders venue contact", () => {
    const itinerary = buildItinerary({
      venueContact: { name: "Jane Doe", email: null, phone: null },
    });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("Venue Contact")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders booking notes", () => {
    const itinerary = buildItinerary({
      booking: {
        id: "b1",
        created_by: "u1",
        venue_id: "v1",
        promoter_id: null,
        status: "signed",
        payer_type: "venue",
        payer_user_id: null,
        notes: "Bring extra USB sticks",
        created_at: "2026-04-01T00:00:00Z",
        updated_at: "2026-04-01T00:00:00Z",
      },
    });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("Bring extra USB sticks")).toBeInTheDocument();
  });

  it("shows cancelled status", () => {
    const itinerary = buildItinerary({
      booking: {
        id: "b1",
        created_by: "u1",
        venue_id: "v1",
        promoter_id: null,
        status: "cancelled",
        payer_type: "venue",
        payer_user_id: null,
        notes: null,
        created_at: "2026-04-01T00:00:00Z",
        updated_at: "2026-04-01T00:00:00Z",
      },
    });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("hides venue section when no venue", () => {
    const itinerary = buildItinerary({ venue: null });
    render(<ItineraryView itinerary={itinerary} />);
    expect(screen.queryByText("Basement Club")).not.toBeInTheDocument();
  });
});
