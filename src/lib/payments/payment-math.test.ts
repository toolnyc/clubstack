import { describe, it, expect } from "vitest";
import {
  calculatePaymentSchedule,
  getBalanceDueDate,
  calculateTransferSplit,
} from "./payment-math";

describe("calculatePaymentSchedule", () => {
  it("calculates 50% deposit", () => {
    const result = calculatePaymentSchedule(1000, 50, null, "day_before");

    expect(result.depositAmount).toBe(500);
    expect(result.balanceAmount).toBe(500);
    expect(result.totalAmount).toBe(1000);
    expect(result.balanceDueDate).toBeNull();
  });

  it("calculates custom deposit percentage", () => {
    const result = calculatePaymentSchedule(1000, 25, null, "day_before");

    expect(result.depositAmount).toBe(250);
    expect(result.balanceAmount).toBe(750);
  });

  it("handles 100% deposit (no balance)", () => {
    const result = calculatePaymentSchedule(1000, 100, null, "day_before");

    expect(result.depositAmount).toBe(1000);
    expect(result.balanceAmount).toBe(0);
  });

  it("handles 0% deposit (full balance)", () => {
    const result = calculatePaymentSchedule(1000, 0, null, "day_before");

    expect(result.depositAmount).toBe(0);
    expect(result.balanceAmount).toBe(1000);
  });

  it("deposit + balance always equals total", () => {
    const amounts = [100, 333.33, 999.99, 1, 0, 10000];
    const pcts = [10, 25, 33, 50, 75, 90];

    for (const amount of amounts) {
      for (const pct of pcts) {
        const result = calculatePaymentSchedule(amount, pct, null, "day_of");
        expect(result.depositAmount + result.balanceAmount).toBeCloseTo(
          result.totalAmount,
          2
        );
      }
    }
  });

  it("sets balance due date when gig date provided", () => {
    const gigDate = new Date("2026-06-15");
    const result = calculatePaymentSchedule(1000, 50, gigDate, "day_before");

    expect(result.balanceDueDate).not.toBeNull();
    expect(result.balanceDueDate!.toISOString().slice(0, 10)).toBe(
      "2026-06-14"
    );
  });
});

describe("getBalanceDueDate", () => {
  const gigDate = new Date("2026-06-15");

  it("returns day before gig", () => {
    const result = getBalanceDueDate(gigDate, "day_before");
    expect(result.toISOString().slice(0, 10)).toBe("2026-06-14");
  });

  it("returns week before gig", () => {
    const result = getBalanceDueDate(gigDate, "week_before");
    expect(result.toISOString().slice(0, 10)).toBe("2026-06-08");
  });

  it("returns gig day for day_of", () => {
    const result = getBalanceDueDate(gigDate, "day_of");
    expect(result.toISOString().slice(0, 10)).toBe("2026-06-15");
  });

  it("does not mutate the input date", () => {
    const original = new Date("2026-06-15");
    const originalTime = original.getTime();
    getBalanceDueDate(original, "day_before");
    expect(original.getTime()).toBe(originalTime);
  });
});

describe("calculateTransferSplit", () => {
  it("splits payment by commission percentage", () => {
    const result = calculateTransferSplit(1000, 15);

    expect(result.agencyAmount).toBe(150);
    expect(result.artistAmount).toBe(850);
  });

  it("handles zero commission", () => {
    const result = calculateTransferSplit(1000, 0);

    expect(result.agencyAmount).toBe(0);
    expect(result.artistAmount).toBe(1000);
  });

  it("artist + agency always equals total payment", () => {
    const cases = [
      { amount: 1000, pct: 15 },
      { amount: 333.33, pct: 20 },
      { amount: 1, pct: 50 },
      { amount: 10000, pct: 7.5 },
    ];

    for (const { amount, pct } of cases) {
      const result = calculateTransferSplit(amount, pct);
      expect(result.artistAmount + result.agencyAmount).toBeCloseTo(amount, 2);
    }
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateTransferSplit(100, 33);

    expect(result.agencyAmount).toBe(33);
    expect(result.artistAmount).toBe(67);
  });
});
