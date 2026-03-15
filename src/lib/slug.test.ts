import { describe, it, expect } from "vitest";
import { generateSlug } from "./slug";

describe("generateSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(generateSlug("DJ Shadow")).toBe("dj-shadow");
  });

  it("strips accents", () => {
    expect(generateSlug("Âme")).toBe("ame");
  });

  it("removes special characters", () => {
    expect(generateSlug("DJ $hadow!")).toBe("dj-hadow");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("DJ   Shadow")).toBe("dj-shadow");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("  DJ Shadow  ")).toBe("dj-shadow");
  });

  it("handles single word", () => {
    expect(generateSlug("Shadow")).toBe("shadow");
  });

  it("handles numbers", () => {
    expect(generateSlug("DJ 3000")).toBe("dj-3000");
  });
});
