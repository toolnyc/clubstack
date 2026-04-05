import { describe, it, expect } from "vitest";
import { getDefaultClauses, DEFAULT_CLAUSES } from "./clause-defaults";

describe("clause-defaults", () => {
  it("returns all 9 clause types", () => {
    expect(DEFAULT_CLAUSES).toHaveLength(9);
  });

  it("each clause has type, title, and content", () => {
    for (const clause of DEFAULT_CLAUSES) {
      expect(clause.type).toBeTruthy();
      expect(clause.title).toBeTruthy();
      expect(clause.content).toBeTruthy();
    }
  });

  it("getDefaultClauses returns a copy", () => {
    const a = getDefaultClauses();
    const b = getDefaultClauses();
    a[0].title = "modified";
    expect(b[0].title).not.toBe("modified");
  });

  it("includes all expected clause types", () => {
    const types = DEFAULT_CLAUSES.map((c) => c.type);
    expect(types).toContain("parties");
    expect(types).toContain("compensation");
    expect(types).toContain("cancellation");
    expect(types).toContain("rider");
    expect(types).toContain("force_majeure");
    expect(types).toContain("pay_or_play");
    expect(types).toContain("recording_rights");
    expect(types).toContain("independent_contractor");
    expect(types).toContain("modifications");
  });
});
