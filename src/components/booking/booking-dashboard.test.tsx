import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BookingDashboard } from "./booking-dashboard";
import type { Booking } from "@/types";

vi.mock("@/lib/hooks/use-breakpoint", () => ({
  useBreakpoint: () => "desktop",
}));

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b-1",
    created_by: "user-1",
    venue_id: "v-1",
    promoter_id: null,
    status: "draft",
    payer_type: "venue",
    payer_user_id: "user-2",
    notes: null,
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
    ...overrides,
  };
}

const bookings: Booking[] = [
  makeBooking({ id: "b-1", status: "draft", notes: "Opening set" }),
  makeBooking({
    id: "b-2",
    status: "signed",
    notes: "Main room",
    created_at: "2026-03-12T00:00:00Z",
  }),
  makeBooking({
    id: "b-3",
    status: "cancelled",
    notes: null,
    created_at: "2026-03-15T00:00:00Z",
  }),
];

describe("BookingDashboard", () => {
  it("renders all bookings in table", () => {
    render(<BookingDashboard bookings={bookings} />);
    expect(screen.getAllByText("Draft").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Signed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThanOrEqual(1);
  });

  it("shows notes or dash for null notes", () => {
    render(<BookingDashboard bookings={bookings} />);
    expect(screen.getByText("Opening set")).toBeInTheDocument();
    expect(screen.getByText("Main room")).toBeInTheDocument();
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("renders date column from created_at", () => {
    render(<BookingDashboard bookings={bookings} />);
    expect(screen.getByText("2026-03-10")).toBeInTheDocument();
    expect(screen.getByText("2026-03-12")).toBeInTheDocument();
  });

  it("shows empty message when no bookings match", () => {
    render(<BookingDashboard bookings={[]} />);
    expect(screen.getByText("No bookings found")).toBeInTheDocument();
  });

  it("renders status filter dropdown", () => {
    render(<BookingDashboard bookings={bookings} />);
    const select = screen.getByLabelText("Status");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("all");
  });

  it("renders date range inputs", () => {
    render(<BookingDashboard bookings={bookings} />);
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("filters by status when dropdown changes", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<BookingDashboard bookings={bookings} />);

    await user.selectOptions(screen.getByLabelText("Status"), "signed");

    // "Signed" should still be in the table + dropdown
    expect(screen.getAllByText("Signed").length).toBeGreaterThanOrEqual(1);
    // "Draft" should only be in the dropdown now, not the table
    expect(screen.queryByText("Opening set")).not.toBeInTheDocument();
  });

  it("filters by date range", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<BookingDashboard bookings={bookings} />);

    const fromInput = screen.getByLabelText("From");
    const toInput = screen.getByLabelText("To");

    await user.clear(fromInput);
    await user.type(fromInput, "2026-03-11");
    await user.clear(toInput);
    await user.type(toInput, "2026-03-14");

    expect(screen.queryByText("Opening set")).not.toBeInTheDocument();
    expect(screen.getByText("Main room")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BookingDashboard bookings={bookings} onRowClick={onClick} />);

    await user.click(screen.getByText("Opening set"));
    expect(onClick).toHaveBeenCalledWith(bookings[0]);
  });

  it("applies custom className", () => {
    const { container } = render(
      <BookingDashboard bookings={[]} className="my-custom" />
    );
    expect(
      container.querySelector(".booking-dash.my-custom")
    ).toBeInTheDocument();
  });
});
