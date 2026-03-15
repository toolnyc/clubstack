import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AgencyInvites } from "./agency-invites";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/agency/actions", () => ({
  respondToInvite: vi.fn().mockResolvedValue({ error: null }),
}));

const invites = [
  {
    id: "inv-1",
    commission_pct: 15,
    agency: { id: "a-1", name: "Holt Booking", location: "NYC" },
  },
  {
    id: "inv-2",
    commission_pct: 20,
    agency: { id: "a-2", name: "Night Agency", location: null },
  },
];

describe("AgencyInvites", () => {
  it("renders nothing when no invites", () => {
    const { container } = render(<AgencyInvites invites={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders invite list with agency names", () => {
    render(<AgencyInvites invites={invites} />);
    expect(screen.getByText("Holt Booking")).toBeInTheDocument();
    expect(screen.getByText("Night Agency")).toBeInTheDocument();
  });

  it("shows accept and decline buttons", () => {
    render(<AgencyInvites invites={[invites[0]]} />);
    expect(screen.getByText("Accept")).toBeInTheDocument();
    expect(screen.getByText("Decline")).toBeInTheDocument();
  });

  it("shows commission percentage", () => {
    render(<AgencyInvites invites={[invites[0]]} />);
    expect(screen.getByText("15% commission")).toBeInTheDocument();
  });

  it("shows location when available", () => {
    render(<AgencyInvites invites={[invites[0]]} />);
    expect(screen.getByText("NYC")).toBeInTheDocument();
  });
});
