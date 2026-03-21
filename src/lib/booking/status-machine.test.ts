import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStatuses,
  VALID_TRANSITIONS,
} from "./status-machine";

describe("canTransition", () => {
  it("allows draft → contract_sent", () => {
    expect(canTransition("draft", "contract_sent")).toBe(true);
  });

  it("allows draft → cancelled", () => {
    expect(canTransition("draft", "cancelled")).toBe(true);
  });

  it("rejects draft → signed (must go through contract_sent)", () => {
    expect(canTransition("draft", "signed")).toBe(false);
  });

  it("rejects draft → deposit_paid (skipping steps)", () => {
    expect(canTransition("draft", "deposit_paid")).toBe(false);
  });

  it("follows the full happy path", () => {
    expect(canTransition("draft", "contract_sent")).toBe(true);
    expect(canTransition("contract_sent", "signed")).toBe(true);
    expect(canTransition("signed", "deposit_paid")).toBe(true);
    expect(canTransition("deposit_paid", "balance_paid")).toBe(true);
    expect(canTransition("balance_paid", "completed")).toBe(true);
  });

  it("allows cancellation from any active status", () => {
    const cancelableStatuses = [
      "draft",
      "contract_sent",
      "signed",
      "deposit_paid",
      "balance_paid",
    ] as const;

    for (const status of cancelableStatuses) {
      expect(canTransition(status, "cancelled")).toBe(true);
    }
  });

  it("prevents transitions from terminal states", () => {
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(canTransition("completed", "draft")).toBe(false);
    expect(canTransition("cancelled", "draft")).toBe(false);
    expect(canTransition("cancelled", "completed")).toBe(false);
  });

  it("prevents backward transitions", () => {
    expect(canTransition("signed", "contract_sent")).toBe(false);
    expect(canTransition("deposit_paid", "signed")).toBe(false);
    expect(canTransition("balance_paid", "deposit_paid")).toBe(false);
    expect(canTransition("completed", "balance_paid")).toBe(false);
  });
});

describe("getNextStatuses", () => {
  it.each([
    ["draft", ["contract_sent", "cancelled"]],
    ["contract_sent", ["signed", "cancelled"]],
    ["signed", ["deposit_paid", "cancelled"]],
    ["deposit_paid", ["balance_paid", "cancelled"]],
    ["balance_paid", ["completed", "cancelled"]],
    ["completed", []],
    ["cancelled", []],
  ] as const)("returns correct next statuses for %s", (status, expected) => {
    expect(getNextStatuses(status)).toEqual(expected);
  });
});

describe("VALID_TRANSITIONS completeness", () => {
  it("covers all booking statuses", () => {
    const allStatuses = [
      "draft",
      "contract_sent",
      "signed",
      "deposit_paid",
      "balance_paid",
      "completed",
      "cancelled",
    ];

    for (const status of allStatuses) {
      expect(VALID_TRANSITIONS).toHaveProperty(status);
    }
  });
});
