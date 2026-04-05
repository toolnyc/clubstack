import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CalendarConnect } from "./calendar-connect";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// Mock fetch for disconnect
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("CalendarConnect", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockFetch.mockReset();
  });

  it("renders connect button when not connected", () => {
    render(<CalendarConnect connected={false} />);
    expect(screen.getByText("Connect")).toBeInTheDocument();
    expect(
      screen.getByText("Connect your Google Calendar")
    ).toBeInTheDocument();
  });

  it("links to OAuth connect endpoint", () => {
    render(<CalendarConnect connected={false} />);
    const link = screen.getByText("Connect").closest("a");
    expect(link).toHaveAttribute("href", "/api/calendar/connect");
  });

  it("shows connected state with disconnect button", () => {
    render(
      <CalendarConnect connected={true} connectedSince="2026-03-01T00:00:00Z" />
    );
    expect(screen.getByText("Google Calendar connected")).toBeInTheDocument();
    expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
  });

  it("calls disconnect API and refreshes on disconnect", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({ ok: true });

    render(<CalendarConnect connected={true} />);
    await user.click(screen.getByText(/Disconnect/));

    expect(mockFetch).toHaveBeenCalledWith("/api/calendar/disconnect", {
      method: "POST",
    });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
