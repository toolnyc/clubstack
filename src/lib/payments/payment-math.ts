import { round2 } from "@/lib/math";
import type { BalanceDueTiming } from "@/types";

export interface PaymentSchedule {
  depositAmount: number;
  balanceAmount: number;
  totalAmount: number;
  balanceDueDate: Date | null;
}

export function calculatePaymentSchedule(
  totalOwed: number,
  depositPct: number,
  gigDate: Date | null,
  balanceTiming: BalanceDueTiming
): PaymentSchedule {
  const depositAmount = round2((totalOwed * depositPct) / 100);
  const balanceAmount = round2(totalOwed - depositAmount);

  let balanceDueDate: Date | null = null;
  if (gigDate) {
    balanceDueDate = getBalanceDueDate(gigDate, balanceTiming);
  }

  return {
    depositAmount,
    balanceAmount,
    totalAmount: round2(totalOwed),
    balanceDueDate,
  };
}

export function getBalanceDueDate(
  gigDate: Date,
  timing: BalanceDueTiming
): Date {
  const d = new Date(gigDate);
  switch (timing) {
    case "day_before":
      d.setDate(d.getDate() - 1);
      return d;
    case "week_before":
      d.setDate(d.getDate() - 7);
      return d;
    case "day_of":
      return d;
  }
}

export interface TransferSplit {
  artistAmount: number;
  agencyAmount: number;
}

export function calculateTransferSplit(
  paymentAmount: number,
  commissionPct: number
): TransferSplit {
  const agencyAmount = round2((paymentAmount * commissionPct) / 100);
  const artistAmount = round2(paymentAmount - agencyAmount);

  return { artistAmount, agencyAmount };
}
