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

  it.each(statuses)("applies status-dot--%s class", (status) => {
    const { container } = render(<StatusDot status={status} />);
    expect(container.firstChild).toHaveClass(`status-dot--${status}`);
  });

  it("renders a dot element", () => {
    const { container } = render(<StatusDot status="available" />);
    expect(container.querySelector(".status-dot__dot")).toBeInTheDocument();
  });

  it("accepts custom label", () => {
    render(<StatusDot status="booked" label="Confirmed" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    const { container } = render(
      <StatusDot status="busy" className="custom" />
    );
    expect(container.firstChild).toHaveClass("custom");
  });
});
