import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusDot } from "./status-dot";
import type { StatusType } from "./status-dot";

describe("StatusDot", () => {
  const statuses: StatusType[] = [
    "available",
    "busy",
    "booked",
    "hold",
    "paid",
    "overdue",
    "error",
  ];

  it.each(statuses)("renders %s status with default label", (status) => {
    render(<StatusDot status={status} />);
    const expected = status.charAt(0).toUpperCase() + status.slice(1);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("accepts custom label", () => {
    render(<StatusDot status="booked" label="Confirmed" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });
});
