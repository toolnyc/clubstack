import { describe, it, expect } from "vitest";
import {
  VALID_TRANSITIONS,
  canTransition,
  getNextStatuses,
} from "./status-machine";
import type { BookingStatusOrCancelled } from "./status-machine";

const ALL_STATUSES: BookingStatusOrCancelled[] = [
  "draft",
  "contract_sent",
  "signed",
  "deposit_paid",
  "balance_paid",
  "completed",
  "cancelled",
];

const HAPPY_PATH: [BookingStatusOrCancelled, BookingStatusOrCancelled][] = [
  ["draft", "contract_sent"],
  ["contract_sent", "signed"],
  ["signed", "deposit_paid"],
  ["deposit_paid", "balance_paid"],
  ["balance_paid", "completed"],
];

describe("status-machine", () => {
  describe("VALID_TRANSITIONS", () => {
    it("defines transitions for every status", () => {
      for (const status of ALL_STATUSES) {
        expect(VALID_TRANSITIONS[status]).toBeDefined();
      }
    });
  });

  describe("canTransition — valid forward transitions", () => {
    it.each(HAPPY_PATH)("allows %s → %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });
  });

  describe("canTransition — cancellation from any non-terminal state", () => {
    const cancellable: BookingStatusOrCancelled[] = [
      "draft",
      "contract_sent",
      "signed",
      "deposit_paid",
      "balance_paid",
    ];

    it.each(cancellable)("allows %s → cancelled", (from) => {
      expect(canTransition(from, "cancelled")).toBe(true);
    });
  });

  describe("canTransition — invalid transitions", () => {
    it("cannot skip steps: draft → signed", () => {
      expect(canTransition("draft", "signed")).toBe(false);
    });

    it("cannot skip steps: draft → deposit_paid", () => {
      expect(canTransition("draft", "deposit_paid")).toBe(false);
    });

    it("cannot skip steps: draft → balance_paid", () => {
      expect(canTransition("draft", "balance_paid")).toBe(false);
    });

    it("cannot skip steps: draft → completed", () => {
      expect(canTransition("draft", "completed")).toBe(false);
    });

    it("cannot skip steps: contract_sent → deposit_paid", () => {
      expect(canTransition("contract_sent", "deposit_paid")).toBe(false);
    });

    it("cannot skip steps: signed → balance_paid", () => {
      expect(canTransition("signed", "balance_paid")).toBe(false);
    });

    it("cannot skip steps: signed → completed", () => {
      expect(canTransition("signed", "completed")).toBe(false);
    });

    it("cannot go backwards: signed → draft", () => {
      expect(canTransition("signed", "draft")).toBe(false);
    });

    it("cannot go backwards: completed → balance_paid", () => {
      expect(canTransition("completed", "balance_paid")).toBe(false);
    });

    it("cannot go backwards: deposit_paid → signed", () => {
      expect(canTransition("deposit_paid", "signed")).toBe(false);
    });

    it("cannot transition to self: draft → draft", () => {
      expect(canTransition("draft", "draft")).toBe(false);
    });
  });

  describe("canTransition — terminal states", () => {
    it("cannot transition from completed", () => {
      for (const to of ALL_STATUSES) {
        expect(canTransition("completed", to)).toBe(false);
      }
    });

    it("cannot transition from cancelled", () => {
      for (const to of ALL_STATUSES) {
        expect(canTransition("cancelled", to)).toBe(false);
      }
    });

    it("cannot cancel a completed booking", () => {
      expect(canTransition("completed", "cancelled")).toBe(false);
    });

    it("cannot cancel an already cancelled booking", () => {
      expect(canTransition("cancelled", "cancelled")).toBe(false);
    });
  });

  describe("getNextStatuses", () => {
    it("returns contract_sent and cancelled for draft", () => {
      expect(getNextStatuses("draft")).toEqual(["contract_sent", "cancelled"]);
    });

    it("returns signed and cancelled for contract_sent", () => {
      expect(getNextStatuses("contract_sent")).toEqual(["signed", "cancelled"]);
    });

    it("returns deposit_paid and cancelled for signed", () => {
      expect(getNextStatuses("signed")).toEqual(["deposit_paid", "cancelled"]);
    });

    it("returns balance_paid and cancelled for deposit_paid", () => {
      expect(getNextStatuses("deposit_paid")).toEqual([
        "balance_paid",
        "cancelled",
      ]);
    });

    it("returns completed and cancelled for balance_paid", () => {
      expect(getNextStatuses("balance_paid")).toEqual([
        "completed",
        "cancelled",
      ]);
    });

    it("returns empty array for completed", () => {
      expect(getNextStatuses("completed")).toEqual([]);
    });

    it("returns empty array for cancelled", () => {
      expect(getNextStatuses("cancelled")).toEqual([]);
    });
  });
});
