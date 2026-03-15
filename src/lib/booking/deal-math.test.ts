import { describe, it, expect } from "vitest";
import { calculateArtistBreakdown, calculateDealSummary } from "./deal-math";

describe("calculateArtistBreakdown", () => {
  it("calculates single artist with standard commission", () => {
    const result = calculateArtistBreakdown({
      fee: 1000,
      commission_pct: 15,
      payment_split_pct: 100,
    });
    expect(result.fee).toBe(1000);
    expect(result.splitFee).toBe(1000);
    expect(result.commission).toBe(150);
    expect(result.netToArtist).toBe(850);
    expect(result.netToBooker).toBe(150);
  });

  it("handles 0% commission", () => {
    const result = calculateArtistBreakdown({
      fee: 2000,
      commission_pct: 0,
      payment_split_pct: 100,
    });
    expect(result.commission).toBe(0);
    expect(result.netToArtist).toBe(2000);
    expect(result.netToBooker).toBe(0);
  });

  it("handles B2B split (50/50)", () => {
    const result = calculateArtistBreakdown({
      fee: 2000,
      commission_pct: 15,
      payment_split_pct: 50,
    });
    expect(result.splitFee).toBe(1000);
    expect(result.commission).toBe(150);
    expect(result.netToArtist).toBe(850);
  });

  it("handles uneven B2B split (60/40)", () => {
    const result = calculateArtistBreakdown({
      fee: 1000,
      commission_pct: 10,
      payment_split_pct: 60,
    });
    expect(result.splitFee).toBe(600);
    expect(result.commission).toBe(60);
    expect(result.netToArtist).toBe(540);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateArtistBreakdown({
      fee: 1000,
      commission_pct: 33.33,
      payment_split_pct: 100,
    });
    expect(result.commission).toBe(333.3);
    expect(result.netToArtist).toBe(666.7);
  });

  it("handles 100% commission (agency keeps all)", () => {
    const result = calculateArtistBreakdown({
      fee: 500,
      commission_pct: 100,
      payment_split_pct: 100,
    });
    expect(result.commission).toBe(500);
    expect(result.netToArtist).toBe(0);
    expect(result.netToBooker).toBe(500);
  });
});

describe("calculateDealSummary", () => {
  it("calculates single artist deal with no costs", () => {
    const result = calculateDealSummary(
      [{ fee: 1500, commission_pct: 15, payment_split_pct: 100 }],
      []
    );
    expect(result.grossFees).toBe(1500);
    expect(result.totalCosts).toBe(0);
    expect(result.totalCommission).toBe(225);
    expect(result.totalDueToArtists).toBe(1275);
    expect(result.totalDueToBooker).toBe(225);
    expect(result.totalOwed).toBe(1500);
  });

  it("calculates deal with costs", () => {
    const result = calculateDealSummary(
      [{ fee: 1000, commission_pct: 15, payment_split_pct: 100 }],
      [{ amount: 300 }, { amount: 200 }]
    );
    expect(result.totalCosts).toBe(500);
    expect(result.totalOwed).toBe(1500); // fees + costs
  });

  it("calculates B2B deal with two artists", () => {
    const result = calculateDealSummary(
      [
        { fee: 2000, commission_pct: 15, payment_split_pct: 50 },
        { fee: 2000, commission_pct: 15, payment_split_pct: 50 },
      ],
      []
    );
    expect(result.grossFees).toBe(2000); // 1000 + 1000
    expect(result.totalCommission).toBe(300); // 150 + 150
    expect(result.totalDueToArtists).toBe(1700); // 850 + 850
    expect(result.artists).toHaveLength(2);
    expect(result.artists[0].splitFee).toBe(1000);
    expect(result.artists[1].splitFee).toBe(1000);
  });

  it("calculates deal with different commission rates per artist", () => {
    const result = calculateDealSummary(
      [
        { fee: 1000, commission_pct: 10, payment_split_pct: 100 },
        { fee: 2000, commission_pct: 20, payment_split_pct: 100 },
      ],
      []
    );
    expect(result.totalCommission).toBe(500); // 100 + 400
    expect(result.totalDueToArtists).toBe(2500); // 900 + 1600
    expect(result.grossFees).toBe(3000);
  });

  it("handles empty artists", () => {
    const result = calculateDealSummary([], [{ amount: 100 }]);
    expect(result.grossFees).toBe(0);
    expect(result.totalCosts).toBe(100);
    expect(result.totalOwed).toBe(100);
  });

  it("handles empty costs", () => {
    const result = calculateDealSummary(
      [{ fee: 500, commission_pct: 10, payment_split_pct: 100 }],
      []
    );
    expect(result.totalCosts).toBe(0);
    expect(result.totalOwed).toBe(500);
  });
});
