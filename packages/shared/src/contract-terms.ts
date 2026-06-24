import { round2 } from "./math";

export type EntitlementKind = "fixed" | "pct";

export interface Entitlement {
  kind: EntitlementKind;
  value: number;
}

export interface Payee {
  recipient_user_id: string;
  role_label: string;
  entitlement: Entitlement;
  priority: number;
}

export interface FeeLine {
  description: string;
  amount: number;
  payees: Payee[];
}

export interface TermsSnapshot {
  version: 1;
  frozen_at: string;
  fee_lines: FeeLine[];
}

/**
 * Pure derivation of the frozen terms snapshot from the live structured terms.
 * Normalizes ordering (payees by priority) and rounds money fields so the
 * frozen copy is deterministic regardless of row insertion order. No money math
 * beyond rounding happens here — distribution is a later concern.
 */
export function buildTermsSnapshot(
  feeLines: FeeLine[],
  frozenAt: string
): TermsSnapshot {
  return {
    version: 1,
    frozen_at: frozenAt,
    fee_lines: feeLines.map((line) => ({
      description: line.description,
      amount: round2(line.amount),
      payees: [...line.payees]
        .sort((a, b) => a.priority - b.priority)
        .map((payee) => ({
          recipient_user_id: payee.recipient_user_id,
          role_label: payee.role_label,
          priority: payee.priority,
          entitlement: {
            kind: payee.entitlement.kind,
            value: round2(payee.entitlement.value),
          },
        })),
    })),
  };
}
