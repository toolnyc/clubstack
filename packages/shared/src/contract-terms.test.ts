import { describe, it, expect } from "vitest";
import { buildTermsSnapshot, type FeeLine } from "./contract-terms";

const FROZEN_AT = "2026-06-24T00:00:00.000Z";

describe("buildTermsSnapshot", () => {
  it("stamps version and frozen_at", () => {
    const snapshot = buildTermsSnapshot([], FROZEN_AT);
    expect(snapshot.version).toBe(1);
    expect(snapshot.frozen_at).toBe(FROZEN_AT);
    expect(snapshot.fee_lines).toEqual([]);
  });

  it("captures a single fee line with one payee", () => {
    const lines: FeeLine[] = [
      {
        description: "Performance fee — DJ Shadow",
        amount: 1000,
        payees: [
          {
            recipient_user_id: "user-dj",
            role_label: "performer",
            priority: 0,
            entitlement: { kind: "pct", value: 100 },
          },
        ],
      },
    ];

    const snapshot = buildTermsSnapshot(lines, FROZEN_AT);

    expect(snapshot.fee_lines).toHaveLength(1);
    expect(snapshot.fee_lines[0]).toEqual(lines[0]);
  });

  it("orders payees within a line by priority", () => {
    const lines: FeeLine[] = [
      {
        description: "Performance fee",
        amount: 2000,
        payees: [
          {
            recipient_user_id: "user-dj",
            role_label: "performer",
            priority: 2,
            entitlement: { kind: "pct", value: 85 },
          },
          {
            recipient_user_id: "user-agency",
            role_label: "commission",
            priority: 1,
            entitlement: { kind: "pct", value: 15 },
          },
        ],
      },
    ];

    const snapshot = buildTermsSnapshot(lines, FROZEN_AT);

    expect(snapshot.fee_lines[0].payees.map((p) => p.role_label)).toEqual([
      "commission",
      "performer",
    ]);
  });

  it("does not mutate the input payee arrays", () => {
    const payees = [
      {
        recipient_user_id: "b",
        role_label: "performer",
        priority: 2,
        entitlement: { kind: "pct" as const, value: 50 },
      },
      {
        recipient_user_id: "a",
        role_label: "commission",
        priority: 1,
        entitlement: { kind: "pct" as const, value: 50 },
      },
    ];
    const lines: FeeLine[] = [
      { description: "fee", amount: 100, payees },
    ];

    buildTermsSnapshot(lines, FROZEN_AT);

    expect(payees[0].recipient_user_id).toBe("b");
    expect(payees[1].recipient_user_id).toBe("a");
  });

  it("captures multiple fee lines (multi-artist)", () => {
    const lines: FeeLine[] = [
      {
        description: "Performance fee — A",
        amount: 1000,
        payees: [
          {
            recipient_user_id: "a",
            role_label: "performer",
            priority: 0,
            entitlement: { kind: "fixed", value: 1000 },
          },
        ],
      },
      {
        description: "Performance fee — B",
        amount: 500,
        payees: [
          {
            recipient_user_id: "b",
            role_label: "performer",
            priority: 0,
            entitlement: { kind: "fixed", value: 500 },
          },
        ],
      },
    ];

    const snapshot = buildTermsSnapshot(lines, FROZEN_AT);

    expect(snapshot.fee_lines).toHaveLength(2);
    expect(snapshot.fee_lines.map((l) => l.description)).toEqual([
      "Performance fee — A",
      "Performance fee — B",
    ]);
  });

  it("rounds money fields to 2 decimals", () => {
    const lines: FeeLine[] = [
      {
        description: "fee",
        amount: 1000.005,
        payees: [
          {
            recipient_user_id: "a",
            role_label: "performer",
            priority: 0,
            entitlement: { kind: "fixed", value: 333.333 },
          },
        ],
      },
    ];

    const snapshot = buildTermsSnapshot(lines, FROZEN_AT);

    expect(snapshot.fee_lines[0].amount).toBe(1000.01);
    expect(snapshot.fee_lines[0].payees[0].entitlement.value).toBe(333.33);
  });
});
