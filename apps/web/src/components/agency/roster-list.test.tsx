import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RosterList } from "./roster-list";
import type { RosterEntry } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/roster",
}));

function makeEntry(overrides: Partial<RosterEntry> = {}): RosterEntry {
  return {
    id: "entry-1",
    agency_id: "agency-1",
    dj_profile_id: "dj-1",
    status: "active",
    commission_pct: 15,
    private_notes: null,
    invited_email: null,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    dj_profile: {
      id: "dj-1",
      name: "DJ Test",
      slug: "dj-test",
      location: "NYC",
      rate_min: 500,
      rate_max: 1500,
    },
    ...overrides,
  };
}

describe("RosterList", () => {
  it("renders empty state when no entries", () => {
    render(<RosterList entries={[]} />);
    expect(screen.getByText(/no artists on your roster/i)).toBeInTheDocument();
  });

  it("renders artist name and location", () => {
    render(<RosterList entries={[makeEntry()]} />);
    expect(screen.getByText("DJ Test")).toBeInTheDocument();
    expect(screen.getByText("NYC")).toBeInTheDocument();
  });

  it("shows rate range", () => {
    render(<RosterList entries={[makeEntry()]} />);
    expect(screen.getByText("$500–$1500")).toBeInTheDocument();
  });

  it("shows commission percentage", () => {
    render(<RosterList entries={[makeEntry()]} />);
    expect(screen.getByText("15% commission")).toBeInTheDocument();
  });

  it("shows pending badge for pending artists", () => {
    render(<RosterList entries={[makeEntry({ status: "pending" })]} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("calls onEdit when item is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const entry = makeEntry();

    render(<RosterList entries={[entry]} onEdit={onEdit} />);
    await user.click(screen.getByRole("button"));

    expect(onEdit).toHaveBeenCalledWith(entry);
  });

  it("renders multiple entries", () => {
    const entries = [
      makeEntry({
        id: "e1",
        dj_profile: {
          id: "d1",
          name: "DJ Alpha",
          slug: "dj-alpha",
          location: null,
          rate_min: null,
          rate_max: null,
        },
      }),
      makeEntry({
        id: "e2",
        dj_profile: {
          id: "d2",
          name: "DJ Beta",
          slug: "dj-beta",
          location: "LA",
          rate_min: 1000,
          rate_max: 2000,
        },
      }),
    ];
    render(<RosterList entries={entries} />);
    expect(screen.getByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
  });
});
