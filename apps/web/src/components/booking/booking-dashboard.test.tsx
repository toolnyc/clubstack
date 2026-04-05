import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BookingDashboard } from "./booking-dashboard";
import { buildBooking } from "@/test/factories";

vi.mock("@/lib/hooks/use-breakpoint", () => ({
  useBreakpoint: () => "desktop",
}));

const bookings = [
  buildBooking({ id: "b-1", status: "draft", notes: "Opening set" }),
  buildBooking({
    id: "b-2",
    status: "signed",
    notes: "Main room",
    created_at: "2026-03-12T00:00:00Z",
  }),
  buildBooking({
    id: "b-3",
    status: "cancelled",
    notes: null,
    created_at: "2026-03-15T00:00:00Z",
  }),
];

describe("BookingDashboard", () => {
  it("renders all bookings in table", () => {
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

  it("filters by status when dropdown changes", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<BookingDashboard bookings={bookings} />);

    await user.selectOptions(screen.getByLabelText("Status"), "signed");

    expect(screen.queryByText("Opening set")).not.toBeInTheDocument();
    expect(screen.getByText("Main room")).toBeInTheDocument();
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
});
