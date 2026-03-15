import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DealSummary } from "./deal-summary";

describe("DealSummary", () => {
  it("shows full breakdown in full view mode", () => {
    render(
      <DealSummary
        artists={[{ fee: 1000, commission_pct: 15, payment_split_pct: 100 }]}
        costs={[]}
        viewMode="full"
        artistNames={["DJ Test"]}
      />
    );
    expect(screen.getByText("DJ Test")).toBeInTheDocument();
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("−$150.00")).toBeInTheDocument();
    expect(screen.getByText("$850.00")).toBeInTheDocument();
  });

  it("shows only total in payer view mode", () => {
    render(
      <DealSummary
        artists={[{ fee: 1000, commission_pct: 15, payment_split_pct: 100 }]}
        costs={[{ amount: 200 }]}
        viewMode="payer"
      />
    );
    expect(screen.getByText("Total due")).toBeInTheDocument();
    expect(screen.getByText("$1,200.00")).toBeInTheDocument();
    expect(screen.queryByText("Commission")).not.toBeInTheDocument();
  });

  it("shows costs when present", () => {
    render(
      <DealSummary
        artists={[{ fee: 500, commission_pct: 10, payment_split_pct: 100 }]}
        costs={[{ amount: 100 }, { amount: 50 }]}
        viewMode="full"
      />
    );
    expect(screen.getByText("$150.00")).toBeInTheDocument(); // costs
  });

  it("handles B2B with multiple artists", () => {
    render(
      <DealSummary
        artists={[
          { fee: 2000, commission_pct: 15, payment_split_pct: 50 },
          { fee: 2000, commission_pct: 15, payment_split_pct: 50 },
        ]}
        costs={[]}
        viewMode="full"
        artistNames={["DJ Alpha", "DJ Beta"]}
      />
    );
    expect(screen.getByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
  });
});
