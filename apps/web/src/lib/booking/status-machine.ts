import type { BookingStatus } from "@/types";

type BookingStatusOrCancelled = BookingStatus | "cancelled";

const VALID_TRANSITIONS: Record<
  BookingStatusOrCancelled,
  readonly BookingStatusOrCancelled[]
> = {
  draft: ["contract_sent", "cancelled"],
  contract_sent: ["signed", "cancelled"],
  signed: ["deposit_paid", "cancelled"],
  deposit_paid: ["balance_paid", "cancelled"],
  balance_paid: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
} as const;

function canTransition(
  from: BookingStatusOrCancelled,
  to: BookingStatusOrCancelled
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed.includes(to);
}

function getNextStatuses(
  current: BookingStatusOrCancelled
): readonly BookingStatusOrCancelled[] {
  return VALID_TRANSITIONS[current];
}

export { VALID_TRANSITIONS, canTransition, getNextStatuses };
export type { BookingStatusOrCancelled };
