import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "./sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Sidebar", () => {
  it("renders navigation items", () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.getByText("Roster")).toBeInTheDocument();
  });

  it("shows logo text when expanded", () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />);
    expect(screen.getByText("Clubstack")).toBeInTheDocument();
  });

  it("shows abbreviated logo when collapsed", () => {
    render(<Sidebar collapsed={true} onToggle={() => {}} />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("hides nav labels when collapsed", () => {
    render(<Sidebar collapsed={true} onToggle={() => {}} />);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("marks active nav item", () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("calls onToggle when collapse button clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Sidebar collapsed={false} onToggle={onToggle} />);
    await user.click(screen.getByLabelText("Collapse sidebar"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows expand label when collapsed", () => {
    render(<Sidebar collapsed={true} onToggle={() => {}} />);
    expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
  });

  it("renders theme toggle buttons when expanded", () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />);
    expect(screen.getByLabelText("Light theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Dark theme")).toBeInTheDocument();
    expect(screen.getByLabelText("System theme")).toBeInTheDocument();
  });

  it("hides theme toggle when collapsed", () => {
    render(<Sidebar collapsed={true} onToggle={() => {}} />);
    expect(screen.queryByLabelText("Light theme")).not.toBeInTheDocument();
  });

  it("has Settings link", () => {
    render(<Sidebar collapsed={false} onToggle={() => {}} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
