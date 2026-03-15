import { describe, it, expect } from "vitest";
import {
  calculatePaymentSchedule,
  getBalanceDueDate,
  calculateTransferSplit,
} from "./payment-math";

describe("calculatePaymentSchedule", () => {
  it("calculates default 50% deposit", () => {
    const result = calculatePaymentSchedule(1000, 50, null, "day_of");
    expect(result.depositAmount).toBe(500);
    expect(result.balanceAmount).toBe(500);
    expect(result.totalAmount).toBe(1000);
  });

  it("calculates custom deposit percentage", () => {
    const result = calculatePaymentSchedule(1500, 30, null, "day_of");
    expect(result.depositAmount).toBe(450);
    expect(result.balanceAmount).toBe(1050);
  });

  it("handles 100% deposit", () => {
    const result = calculatePaymentSchedule(2000, 100, null, "day_of");
    expect(result.depositAmount).toBe(2000);
    expect(result.balanceAmount).toBe(0);
  });

  it("handles 0% deposit", () => {
    const result = calculatePaymentSchedule(1000, 0, null, "day_of");
    expect(result.depositAmount).toBe(0);
    expect(result.balanceAmount).toBe(1000);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculatePaymentSchedule(1000, 33.33, null, "day_of");
    expect(result.depositAmount).toBe(333.3);
    expect(result.balanceAmount).toBe(666.7);
  });

  it("calculates balance due date day_of", () => {
    const gig = new Date("2026-04-15");
    const result = calculatePaymentSchedule(1000, 50, gig, "day_of");
    expect(result.balanceDueDate?.toISOString().split("T")[0]).toBe(
      "2026-04-15"
    );
  });

  it("calculates balance due date day_before", () => {
    const gig = new Date("2026-04-15");
    const result = calculatePaymentSchedule(1000, 50, gig, "day_before");
    expect(result.balanceDueDate?.toISOString().split("T")[0]).toBe(
      "2026-04-14"
    );
  });

  it("calculates balance due date week_before", () => {
    const gig = new Date("2026-04-15");
    const result = calculatePaymentSchedule(1000, 50, gig, "week_before");
    expect(result.balanceDueDate?.toISOString().split("T")[0]).toBe(
      "2026-04-08"
    );
  });

  it("returns null balance due date when no gig date", () => {
    const result = calculatePaymentSchedule(1000, 50, null, "day_of");
    expect(result.balanceDueDate).toBeNull();
  });
});

describe("getBalanceDueDate", () => {
  it("returns same date for day_of", () => {
    const gig = new Date("2026-06-01");
    const result = getBalanceDueDate(gig, "day_of");
    expect(result.toISOString().split("T")[0]).toBe("2026-06-01");
  });

  it("returns day before for day_before", () => {
    const gig = new Date("2026-06-01");
    const result = getBalanceDueDate(gig, "day_before");
    expect(result.toISOString().split("T")[0]).toBe("2026-05-31");
  });

  it("returns week before for week_before", () => {
    const gig = new Date("2026-06-01");
    const result = getBalanceDueDate(gig, "week_before");
    expect(result.toISOString().split("T")[0]).toBe("2026-05-25");
  });
});

describe("calculateTransferSplit", () => {
  it("splits payment with standard commission", () => {
    const result = calculateTransferSplit(1000, 15);
    expect(result.artistAmount).toBe(850);
    expect(result.agencyAmount).toBe(150);
  });

  it("handles 0% commission", () => {
    const result = calculateTransferSplit(1000, 0);
    expect(result.artistAmount).toBe(1000);
    expect(result.agencyAmount).toBe(0);
  });

  it("handles 100% commission", () => {
    const result = calculateTransferSplit(500, 100);
    expect(result.artistAmount).toBe(0);
    expect(result.agencyAmount).toBe(500);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateTransferSplit(1000, 33.33);
    expect(result.agencyAmount).toBe(333.3);
    expect(result.artistAmount).toBe(666.7);
  });

  it("artist + agency = total", () => {
    const result = calculateTransferSplit(1234.56, 17.5);
    expect(result.artistAmount + result.agencyAmount).toBeCloseTo(1234.56, 1);
  });
});
