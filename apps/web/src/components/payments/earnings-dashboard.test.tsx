import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EarningsDashboard } from "./earnings-dashboard";
import { buildEarningsSummary, buildEarningsEntry } from "@/test/factories";

vi.mock("@/lib/hooks/use-breakpoint", () => ({
  useBreakpoint: () => "desktop",
}));

vi.mock("@/lib/payments/earnings-actions", () => ({
  getEarningsHistory: vi.fn().mockResolvedValue({ data: [], error: null }),
  getEarningsSummary: vi.fn().mockResolvedValue({
    data: { totalEarned: 0, totalPending: 0, totalUpcoming: 0, gigCount: 0 },
    error: null,
  }),
  getAnnualSummary: vi.fn().mockResolvedValue({
    data: {
      year: 2026,
      totalEarned: 5000,
      totalCommission: 500,
      netIncome: 4500,
      gigCount: 10,
    },
    error: null,
  }),
}));

const mockSummary = buildEarningsSummary();

const mockHistory = [
  buildEarningsEntry(),
  buildEarningsEntry({
    id: "ea-2",
    date: "2026-03-15",
    eventName: "Saturday Night",
    venueName: null,
    fee: 500,
    commissionPct: 10,
    commission: 50,
    net: 450,
    status: "pending",
  }),
  buildEarningsEntry({
    id: "ea-3",
    date: "2026-04-01",
    eventName: null,
    venueName: "Club Underground",
    fee: 750,
    commissionPct: 0,
    commission: 0,
    net: 750,
    status: "upcoming",
  }),
];

describe("EarningsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders summary cards with correct values and labels", () => {
    render(
      <EarningsDashboard
        initialSummary={mockSummary}
        initialHistory={mockHistory}
      />
    );

    expect(screen.getByText("$12,500.00")).toBeInTheDocument();
    expect(screen.getByText("$3,000.00")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Total earned")).toBeInTheDocument();
    expect(screen.getByText("Total gigs")).toBeInTheDocument();
  });

  it("renders gig history with venue/event fallback", () => {
    render(
      <EarningsDashboard
        initialSummary={mockSummary}
        initialHistory={mockHistory}
      />
    );

    expect(screen.getByText("The Loft")).toBeInTheDocument();
    expect(screen.getByText("Saturday Night")).toBeInTheDocument();
    expect(screen.getByText("Club Underground")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("$850.00")).toBeInTheDocument();
  });

  it("renders filter inputs", () => {
    render(
      <EarningsDashboard
        initialSummary={mockSummary}
        initialHistory={mockHistory}
      />
    );

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("renders status badges for each entry", () => {
    render(
      <EarningsDashboard
        initialSummary={mockSummary}
        initialHistory={mockHistory}
      />
    );

    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("upcoming")).toBeInTheDocument();
  });

  it("shows empty state when no history", () => {
    render(
      <EarningsDashboard initialSummary={mockSummary} initialHistory={[]} />
    );

    expect(screen.getByText("No earnings yet")).toBeInTheDocument();
  });

  it("shows dash for zero commission", () => {
    const zeroCommission = [
      buildEarningsEntry({
        id: "ea-z",
        date: "2026-01-01",
        eventName: "Free Gig",
        venueName: null,
        fee: 200,
        commissionPct: 0,
        commission: 0,
        net: 200,
        status: "completed",
      }),
    ];

    render(
      <EarningsDashboard
        initialSummary={mockSummary}
        initialHistory={zeroCommission}
      />
    );

    expect(screen.getByText("--")).toBeInTheDocument();
  });

  it("loads annual summary on button click", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <EarningsDashboard
        initialSummary={mockSummary}
        initialHistory={mockHistory}
      />
    );

    await user.click(screen.getByText("Load annual tax summary"));

    expect(await screen.findByText("2026 Tax Summary")).toBeInTheDocument();
  });
});
