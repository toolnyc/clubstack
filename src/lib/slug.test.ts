import { describe, it, expect } from "vitest";
import { generateSlug } from "./slug";

describe("generateSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(generateSlug("DJ Shadow")).toBe("dj-shadow");
  });

  it("strips diacritics", () => {
    expect(generateSlug("Âme")).toBe("ame");
  });

  it("handles multiple spaces and special chars", () => {
    expect(generateSlug("Nina  Kraviz!!!")).toBe("nina-kraviz");
  });

  it("strips leading and trailing hyphens", () => {
    expect(generateSlug("---test---")).toBe("test");
  });

  it("handles numbers", () => {
    expect(generateSlug("DJ 3000")).toBe("dj-3000");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("handles ampersands and symbols", () => {
    expect(generateSlug("Above & Beyond")).toBe("above-beyond");
  });
});
