import { describe, it, expect } from "vitest";
import { generateAutoIcon, getInitials, hashString } from "./auto-icon";

describe("hashString", () => {
  it("returns consistent hash for same input", () => {
    expect(hashString("DJ Shadow")).toBe(hashString("DJ Shadow"));
  });

  it("returns different hashes for different inputs", () => {
    expect(hashString("DJ Shadow")).not.toBe(hashString("DJ Koze"));
  });

  it("returns a non-negative number", () => {
    expect(hashString("test")).toBeGreaterThanOrEqual(0);
  });
});

describe("getInitials", () => {
  it("returns first two chars for single word", () => {
    expect(getInitials("Shadow")).toBe("SH");
  });

  it("returns first and last initials for multi-word", () => {
    expect(getInitials("DJ Shadow")).toBe("DS");
  });

  it("handles three words", () => {
    expect(getInitials("DJ Ben Klock")).toBe("DK");
  });

  it("handles lowercase", () => {
    expect(getInitials("shadow")).toBe("SH");
  });

  it("handles extra spaces", () => {
    expect(getInitials("  DJ  Shadow  ")).toBe("DS");
  });
});

describe("generateAutoIcon", () => {
  it("returns a data URI SVG", () => {
    const icon = generateAutoIcon("DJ Shadow");
    expect(icon).toMatch(/^data:image\/svg\+xml,/);
  });

  it("is deterministic", () => {
    expect(generateAutoIcon("DJ Shadow")).toBe(generateAutoIcon("DJ Shadow"));
  });

  it("produces different icons for different names", () => {
    expect(generateAutoIcon("DJ Shadow")).not.toBe(generateAutoIcon("DJ Koze"));
  });

  it("includes initials in SVG", () => {
    const icon = generateAutoIcon("DJ Shadow");
    const decoded = decodeURIComponent(icon);
    expect(decoded).toContain("DS");
  });

  it("accepts custom size", () => {
    const icon = generateAutoIcon("Test", 64);
    const decoded = decodeURIComponent(icon);
    expect(decoded).toContain('width="64"');
  });
});
