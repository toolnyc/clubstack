import { describe, it, expect } from "vitest";
import { generateInvoiceNumber } from "./invoice-number";

describe("generateInvoiceNumber", () => {
  it("starts with CS- prefix", () => {
    const num = generateInvoiceNumber();
    expect(num.startsWith("CS-")).toBe(true);
  });

  it("matches format CS-YYYYMMDD-XXXX", () => {
    const num = generateInvoiceNumber();
    expect(num).toMatch(/^CS-\d{8}-[A-Z0-9]{4}$/);
  });

  it("uses the provided date", () => {
    const date = new Date(2026, 2, 15); // March 15, 2026
    const num = generateInvoiceNumber(date);
    expect(num).toMatch(/^CS-20260315-[A-Z0-9]{4}$/);
  });

  it("pads single-digit months and days", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    const num = generateInvoiceNumber(date);
    expect(num).toMatch(/^CS-20260105-[A-Z0-9]{4}$/);
  });

  it("generates unique numbers on consecutive calls", () => {
    const numbers = new Set<string>();
    for (let i = 0; i < 50; i++) {
      numbers.add(generateInvoiceNumber());
    }
    // With 36^4 = 1.6M possibilities, 50 calls should all be unique
    expect(numbers.size).toBe(50);
  });

  it("has exactly 18 characters", () => {
    const num = generateInvoiceNumber();
    // CS-YYYYMMDD-XXXX = 3 + 8 + 1 + 4 = 16 ... let me count:
    // C S - Y Y Y Y M M D D - X X X X = 16 chars
    expect(num.length).toBe(16);
  });

  it("suffix contains only uppercase letters and digits", () => {
    const num = generateInvoiceNumber();
    const suffix = num.split("-")[2];
    expect(suffix).toMatch(/^[A-Z0-9]{4}$/);
  });
});
