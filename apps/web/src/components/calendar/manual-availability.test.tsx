import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManualAvailabilityEditor } from "./manual-availability";

// Mock server actions
vi.mock("@/lib/calendar/manual-actions", () => ({
  setWeeklyAvailability: vi.fn().mockResolvedValue({ error: null }),
  blockDate: vi.fn().mockResolvedValue({ error: null }),
  unblockDate: vi.fn().mockResolvedValue({ error: null }),
  importICS: vi.fn().mockResolvedValue({ error: null, imported: 3 }),
}));

const mockActions = await import("@/lib/calendar/manual-actions");

describe("ManualAvailabilityEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 7 day toggles", () => {
    render(<ManualAvailabilityEditor initialData={[]} />);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const day of days) {
      expect(screen.getByLabelText(new RegExp(`^${day}:`))).toBeInTheDocument();
    }
  });

  it("renders section headings", () => {
    render(<ManualAvailabilityEditor initialData={[]} />);

    expect(screen.getByText("Weekly availability")).toBeInTheDocument();
    expect(screen.getByText("Blocked dates")).toBeInTheDocument();
    expect(screen.getByText("Import from calendar")).toBeInTheDocument();
  });

  it("toggles day availability on click", async () => {
    const user = userEvent.setup();
    render(<ManualAvailabilityEditor initialData={[]} />);

    const sunToggle = screen.getByLabelText(/^Sun:/);
    expect(sunToggle).toHaveAttribute("aria-pressed", "true");

    await user.click(sunToggle);
    expect(sunToggle).toHaveAttribute("aria-pressed", "false");
  });

  it("renders existing blocked dates from initialData", () => {
    render(
      <ManualAvailabilityEditor
        initialData={[
          {
            id: "1",
            user_id: "u1",
            day_of_week: null,
            specific_date: "2026-04-01",
            is_available: false,
            start_time: null,
            end_time: null,
            created_at: "2026-03-15T00:00:00Z",
            updated_at: "2026-03-15T00:00:00Z",
          },
        ]}
      />
    );

    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
  });

  it("renders weekly defaults from initialData", () => {
    render(
      <ManualAvailabilityEditor
        initialData={[
          {
            id: "2",
            user_id: "u1",
            day_of_week: 0,
            specific_date: null,
            is_available: false,
            start_time: null,
            end_time: null,
            created_at: "2026-03-15T00:00:00Z",
            updated_at: "2026-03-15T00:00:00Z",
          },
        ]}
      />
    );

    const sunToggle = screen.getByLabelText(/Sun/);
    expect(sunToggle).toHaveAttribute("aria-pressed", "false");
  });

  it("calls setWeeklyAvailability on save", async () => {
    const user = userEvent.setup();
    render(<ManualAvailabilityEditor initialData={[]} />);

    await user.click(screen.getByText("Save weekly"));
    expect(mockActions.setWeeklyAvailability).toHaveBeenCalled();
  });

  it("has disabled block button when no date entered", () => {
    render(<ManualAvailabilityEditor initialData={[]} />);

    const blockBtn = screen.getByText("Block");
    expect(blockBtn.closest("button")).toBeDisabled();
  });

  it("has disabled import button when no ICS text entered", () => {
    render(<ManualAvailabilityEditor initialData={[]} />);

    const importBtn = screen.getByText("Import ICS");
    expect(importBtn.closest("button")).toBeDisabled();
  });

  it("shows ICS textarea with placeholder", () => {
    render(<ManualAvailabilityEditor initialData={[]} />);

    const textarea = screen.getByLabelText("ICS calendar data");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "BEGIN:VCALENDAR\n...");
  });

  it("shows remove button for blocked dates", () => {
    render(
      <ManualAvailabilityEditor
        initialData={[
          {
            id: "1",
            user_id: "u1",
            day_of_week: null,
            specific_date: "2026-04-01",
            is_available: false,
            start_time: null,
            end_time: null,
            created_at: "2026-03-15T00:00:00Z",
            updated_at: "2026-03-15T00:00:00Z",
          },
        ]}
      />
    );

    expect(screen.getByLabelText("Unblock 2026-04-01")).toBeInTheDocument();
  });
});
