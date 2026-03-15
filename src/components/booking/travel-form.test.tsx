import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TravelForm } from "./travel-form";
import type { BookingTravel } from "@/types";

// Mock the server actions
vi.mock("@/lib/booking/travel-actions", () => ({
  addTravel: vi.fn().mockResolvedValue({ data: { id: "new-1" }, error: null }),
  updateTravel: vi
    .fn()
    .mockResolvedValue({ data: { id: "existing-1" }, error: null }),
  removeTravel: vi.fn().mockResolvedValue({ error: null }),
}));

const BOOKING_ID = "booking-abc-123";

const existingFlight: BookingTravel = {
  id: "travel-1",
  booking_id: BOOKING_ID,
  type: "flight",
  airline: "Delta",
  flight_number: "DL 420",
  departure_airport: "JFK",
  arrival_airport: "LAX",
  departure_time: "2026-04-10T08:00:00Z",
  arrival_time: "2026-04-10T11:30:00Z",
  hotel_name: null,
  hotel_address: null,
  check_in: null,
  check_out: null,
  transport_details: null,
  notes: "Window seat preferred",
  cost: 350,
  created_at: "2026-03-15T00:00:00Z",
  updated_at: "2026-03-15T00:00:00Z",
};

const existingHotel: BookingTravel = {
  id: "travel-2",
  booking_id: BOOKING_ID,
  type: "hotel",
  airline: null,
  flight_number: null,
  departure_airport: null,
  arrival_airport: null,
  departure_time: null,
  arrival_time: null,
  hotel_name: "Ace Hotel",
  hotel_address: "20 W 29th St, New York",
  check_in: "2026-04-10",
  check_out: "2026-04-12",
  transport_details: null,
  notes: null,
  cost: 450,
  created_at: "2026-03-15T00:00:00Z",
  updated_at: "2026-03-15T00:00:00Z",
};

describe("TravelForm", () => {
  it("renders with three travel type tabs", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    expect(screen.getByRole("tab", { name: "Flight" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hotel" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Ground Transport" })
    ).toBeInTheDocument();
  });

  it("defaults to the flight tab", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    const flightTab = screen.getByRole("tab", { name: "Flight" });
    expect(flightTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText("e.g. Delta")).toBeInTheDocument();
  });

  it("shows hotel fields when hotel tab is clicked", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    fireEvent.click(screen.getByRole("tab", { name: "Hotel" }));

    expect(screen.getByPlaceholderText("e.g. Ace Hotel")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. 20 W 29th St, New York")
    ).toBeInTheDocument();
  });

  it("shows ground transport fields when tab is clicked", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    fireEvent.click(screen.getByRole("tab", { name: "Ground Transport" }));

    expect(
      screen.getByPlaceholderText(
        "e.g. Car service from LAX to venue, 8pm pickup"
      )
    ).toBeInTheDocument();
  });

  it("always shows cost and notes fields", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Optional notes")).toBeInTheDocument();
  });

  it("shows Add travel button in create mode", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    expect(
      screen.getByRole("button", { name: "Add travel" })
    ).toBeInTheDocument();
  });

  it("shows Update button in edit mode", () => {
    render(<TravelForm bookingId={BOOKING_ID} existing={existingFlight} />);

    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("shows Remove button in edit mode", () => {
    render(
      <TravelForm
        bookingId={BOOKING_ID}
        existing={existingFlight}
        onRemoved={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("does not show Remove button in create mode", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    expect(
      screen.queryByRole("button", { name: "Remove" })
    ).not.toBeInTheDocument();
  });

  it("populates fields from existing flight travel", () => {
    render(<TravelForm bookingId={BOOKING_ID} existing={existingFlight} />);

    expect(screen.getByDisplayValue("Delta")).toBeInTheDocument();
    expect(screen.getByDisplayValue("DL 420")).toBeInTheDocument();
    expect(screen.getByDisplayValue("JFK")).toBeInTheDocument();
    expect(screen.getByDisplayValue("LAX")).toBeInTheDocument();
    expect(screen.getByDisplayValue("350")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Window seat preferred")
    ).toBeInTheDocument();
  });

  it("populates fields from existing hotel travel", () => {
    render(<TravelForm bookingId={BOOKING_ID} existing={existingHotel} />);

    const hotelTab = screen.getByRole("tab", { name: "Hotel" });
    expect(hotelTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByDisplayValue("Ace Hotel")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("20 W 29th St, New York")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-12")).toBeInTheDocument();
  });

  it("shows cancel button when onCancel is provided", () => {
    const onCancel = vi.fn();
    render(<TravelForm bookingId={BOOKING_ID} onCancel={onCancel} />);

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(cancelBtn).toBeInTheDocument();

    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not show cancel button when onCancel is not provided", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
  });

  it("allows typing in flight fields", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    const airlineInput = screen.getByPlaceholderText("e.g. Delta");
    fireEvent.change(airlineInput, { target: { value: "JetBlue" } });
    expect(airlineInput).toHaveValue("JetBlue");

    const flightInput = screen.getByPlaceholderText("e.g. DL 1234");
    fireEvent.change(flightInput, { target: { value: "B6 123" } });
    expect(flightInput).toHaveValue("B6 123");
  });

  it("allows typing cost as a number", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    const costInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(costInput, { target: { value: "275.50" } });
    expect(costInput).toHaveValue(275.5);
  });

  it("renders the form element with data-testid", () => {
    render(<TravelForm bookingId={BOOKING_ID} />);

    expect(screen.getByTestId("travel-form")).toBeInTheDocument();
  });
});
