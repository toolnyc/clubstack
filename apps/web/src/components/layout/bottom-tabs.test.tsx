import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomTabs } from "./bottom-tabs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/bookings",
}));

describe("BottomTabs", () => {
  it("renders 4 tabs for non-agency user", () => {
    render(<BottomTabs userType="dj" />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.queryByText("Roster")).not.toBeInTheDocument();
  });

  it("renders Roster tab for agency users", () => {
    render(<BottomTabs userType="agency" />);
    expect(screen.getByText("Roster")).toBeInTheDocument();
  });

  it("marks active tab", () => {
    render(<BottomTabs />);
    const bookingsTab = screen.getByText("Bookings").closest("a");
    expect(bookingsTab).toHaveAttribute("aria-current", "page");
    expect(bookingsTab).toHaveClass("bottom-tabs__item--active");
  });

  it("does not mark inactive tabs", () => {
    render(<BottomTabs />);
    const homeTab = screen.getByText("Home").closest("a");
    expect(homeTab).not.toHaveAttribute("aria-current");
    expect(homeTab).not.toHaveClass("bottom-tabs__item--active");
  });

  it("has navigation landmark", () => {
    render(<BottomTabs />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
