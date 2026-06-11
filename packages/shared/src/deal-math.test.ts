import { describe, it, expect } from "vitest";
import { calculateArtistBreakdown, calculateDealSummary } from "./deal-math";

describe("calculateArtistBreakdown", () => {
  it("calculates standard 15% commission on full fee", () => {
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

  it("applies payment split before commission", () => {
    const result = calculateArtistBreakdown({
      fee: 1000,
      commission_pct: 15,
      payment_split_pct: 50,
    });

    expect(result.splitFee).toBe(500);
    expect(result.commission).toBe(75);
    expect(result.netToArtist).toBe(425);
    expect(result.netToBooker).toBe(75);
  });

  it("handles zero commission", () => {
    const result = calculateArtistBreakdown({
      fee: 500,
      commission_pct: 0,
      payment_split_pct: 100,
    });

    expect(result.commission).toBe(0);
    expect(result.netToArtist).toBe(500);
    expect(result.netToBooker).toBe(0);
  });

  it("handles zero fee", () => {
    const result = calculateArtistBreakdown({
      fee: 0,
      commission_pct: 15,
      payment_split_pct: 100,
    });

    expect(result.fee).toBe(0);
    expect(result.splitFee).toBe(0);
    expect(result.commission).toBe(0);
    expect(result.netToArtist).toBe(0);
    expect(result.netToBooker).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateArtistBreakdown({
      fee: 333,
      commission_pct: 33,
      payment_split_pct: 100,
    });

    expect(result.commission).toBe(109.89);
    expect(result.netToArtist).toBe(223.11);
  });

  it("handles 100% commission (booker takes all)", () => {
    const result = calculateArtistBreakdown({
      fee: 1000,
      commission_pct: 100,
      payment_split_pct: 100,
    });

    expect(result.commission).toBe(1000);
    expect(result.netToArtist).toBe(0);
    expect(result.netToBooker).toBe(1000);
  });
});

describe("calculateDealSummary", () => {
  it("aggregates multiple artists and costs", () => {
    const artists = [
      { fee: 1000, commission_pct: 15, payment_split_pct: 100 },
      { fee: 500, commission_pct: 10, payment_split_pct: 100 },
    ];
    const costs = [{ amount: 200 }, { amount: 100 }];

    const result = calculateDealSummary(artists, costs);

    expect(result.grossFees).toBe(1500);
    expect(result.totalCosts).toBe(300);
    expect(result.totalCommission).toBe(200);
    expect(result.totalDueToArtists).toBe(1300);
    expect(result.totalDueToBooker).toBe(200);
    expect(result.totalOwed).toBe(1800);
    expect(result.artists).toHaveLength(2);
  });

  it("handles empty artists and costs", () => {
    const result = calculateDealSummary([], []);

    expect(result.grossFees).toBe(0);
    expect(result.totalCosts).toBe(0);
    expect(result.totalOwed).toBe(0);
    expect(result.artists).toHaveLength(0);
  });

  it("handles costs with no artists", () => {
    const result = calculateDealSummary([], [{ amount: 500 }]);

    expect(result.grossFees).toBe(0);
    expect(result.totalCosts).toBe(500);
    expect(result.totalOwed).toBe(500);
  });

  it("artist breakdowns sum to totals", () => {
    const artists = [
      { fee: 750, commission_pct: 20, payment_split_pct: 100 },
      { fee: 1250, commission_pct: 12, payment_split_pct: 80 },
      { fee: 300, commission_pct: 0, payment_split_pct: 100 },
    ];

    const result = calculateDealSummary(artists, []);

    const sumNetToArtist = result.artists.reduce(
      (s, a) => s + a.netToArtist,
      0
    );
    const sumCommission = result.artists.reduce((s, a) => s + a.commission, 0);

    expect(result.totalDueToArtists).toBeCloseTo(sumNetToArtist, 2);
    expect(result.totalCommission).toBeCloseTo(sumCommission, 2);
  });
});
