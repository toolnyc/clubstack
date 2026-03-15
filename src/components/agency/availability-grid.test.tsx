import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AvailabilityGrid } from "./availability-grid";
import type { ArtistAvailability } from "@/lib/agency/availability";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/agency/availability", () => ({
  getRosterAvailability: vi.fn().mockResolvedValue([]),
}));

function makeArtistAvailability(
  name: string,
  days: { date: string; status: "available" | "busy" }[] = []
): ArtistAvailability {
  return {
    entry: {
      id: `entry-${name}`,
      agency_id: "agency-1",
      dj_profile_id: `dj-${name}`,
      status: "active",
      commission_pct: 15,
      private_notes: null,
      invited_email: null,
      created_at: "2026-03-15T00:00:00Z",
      updated_at: "2026-03-15T00:00:00Z",
      dj_profile: {
        id: `dj-${name}`,
        name,
        slug: name.toLowerCase().replace(/\s/g, "-"),
        location: "NYC",
        rate_min: 500,
        rate_max: 1500,
      },
    },
    days,
  };
}

describe("AvailabilityGrid", () => {
  it("renders artist names", () => {
    const data = [
      makeArtistAvailability("DJ Alpha"),
      makeArtistAvailability("DJ Beta"),
    ];
    render(<AvailabilityGrid initialData={data} />);
    expect(screen.getByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
  });

  it("renders the grid role", () => {
    render(<AvailabilityGrid initialData={[]} />);
    expect(
      screen.getByRole("grid", { name: "Artist availability" })
    ).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<AvailabilityGrid initialData={[]} />);
    expect(
      screen.getByText("No artists match your filters")
    ).toBeInTheDocument();
  });

  it("renders navigation buttons", () => {
    render(<AvailabilityGrid initialData={[]} />);
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
  });

  it("renders fee filter inputs", () => {
    render(<AvailabilityGrid initialData={[]} />);
    expect(screen.getByLabelText(/Min fee/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max fee/)).toBeInTheDocument();
  });

  it("renders status dots for busy days", () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const data = [
      makeArtistAvailability("DJ Busy", [{ date: dateStr, status: "busy" }]),
    ];
    const { container } = render(<AvailabilityGrid initialData={data} />);
    expect(
      container.querySelector(".avail-grid__dot--busy")
    ).toBeInTheDocument();
  });

  it("calls onArtistClick when artist row is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onArtistClick = vi.fn();
    const data = [makeArtistAvailability("DJ Click")];

    render(
      <AvailabilityGrid initialData={data} onArtistClick={onArtistClick} />
    );
    await user.click(screen.getByText("DJ Click"));

    expect(onArtistClick).toHaveBeenCalledOnce();
    expect(onArtistClick.mock.calls[0][0].dj_profile.name).toBe("DJ Click");
  });
});
