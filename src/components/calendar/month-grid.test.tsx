import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MonthGrid } from "./month-grid";

describe("MonthGrid", () => {
  it("renders weekday headers", () => {
    render(<MonthGrid />);
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("renders day numbers", () => {
    render(<MonthGrid />);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("shows month and year in header", () => {
    render(<MonthGrid />);
    const now = new Date();
    const expected = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("navigates to previous month", async () => {
    const user = userEvent.setup();
    render(<MonthGrid />);

    await user.click(screen.getByLabelText("Previous month"));

    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    const expected = prev.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("navigates to next month", async () => {
    const user = userEvent.setup();
    render(<MonthGrid />);

    await user.click(screen.getByLabelText("Next month"));

    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const expected = next.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("calls onDayClick when a day is clicked", async () => {
    const user = userEvent.setup();
    const onDayClick = vi.fn();
    render(<MonthGrid onDayClick={onDayClick} />);

    const day15 = screen.getByText("15");
    await user.click(day15);

    expect(onDayClick).toHaveBeenCalledOnce();
    expect(onDayClick.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-15/);
  });

  it("renders status dots for days with statuses", () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const { container } = render(
      <MonthGrid statuses={[{ date: dateStr, status: "booked" }]} />
    );

    expect(
      container.querySelector(".month-grid__dot--booked")
    ).toBeInTheDocument();
  });

  it("has calendar grid role", () => {
    render(<MonthGrid />);
    expect(screen.getByRole("grid", { name: "Calendar" })).toBeInTheDocument();
  });
});
