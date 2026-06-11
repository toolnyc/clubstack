import { describe, it, expect } from "vitest";
import { generateInvoiceNumber } from "./invoice-number";

describe("generateInvoiceNumber", () => {
  it("starts with CS- prefix", () => {
    expect(generateInvoiceNumber()).toMatch(/^CS-/);
  });

  it("follows CS-YYYYMMDD-XXXX format", () => {
    expect(generateInvoiceNumber()).toMatch(/^CS-\d{8}-[A-Z0-9]{4}$/);
  });

  it("uses provided date", () => {
    const date = new Date("2026-03-15");
    const result = generateInvoiceNumber(date);
    expect(result).toMatch(/^CS-20260315-[A-Z0-9]{4}$/);
  });

  it("pads single-digit months and days", () => {
    const date = new Date("2026-01-05");
    const result = generateInvoiceNumber(date);
    expect(result).toMatch(/^CS-20260105-/);
  });

  it("generates unique suffixes", () => {
    const date = new Date("2026-01-01");
    const numbers = new Set(
      Array.from({ length: 50 }, () => generateInvoiceNumber(date))
    );
    expect(numbers.size).toBe(50);
  });
});
