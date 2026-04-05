import { describe, it, expect } from "vitest";

// Test the CSV parsing logic directly (extracted for testability)
function parseCSVHeader(csvText: string) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2)
    return { error: "CSV must have a header row and at least one data row" };

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  const emailIdx = header.indexOf("email");
  const commissionIdx = header.indexOf("commission");

  if (emailIdx === -1) return { error: "CSV must have an 'email' column" };

  const rows: { email: string; commission: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const email = cols[emailIdx];
    if (!email) continue;
    const commission = commissionIdx >= 0 ? Number(cols[commissionIdx]) : 15;
    rows.push({ email, commission: isNaN(commission) ? 15 : commission });
  }

  return { error: null, rows };
}

describe("CSV parsing", () => {
  it("parses basic CSV with email column", () => {
    const csv = "email\ndj@example.com";
    const result = parseCSVHeader(csv);
    expect(result.error).toBeNull();
    expect(result.rows).toEqual([{ email: "dj@example.com", commission: 15 }]);
  });

  it("parses CSV with email and commission columns", () => {
    const csv = "email,commission\ndj@example.com,20\ndj2@example.com,10";
    const result = parseCSVHeader(csv);
    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(2);
    expect(result.rows![0]).toEqual({
      email: "dj@example.com",
      commission: 20,
    });
    expect(result.rows![1]).toEqual({
      email: "dj2@example.com",
      commission: 10,
    });
  });

  it("returns error for empty CSV", () => {
    const result = parseCSVHeader("email");
    expect(result.error).toBe(
      "CSV must have a header row and at least one data row"
    );
  });

  it("returns error when no email column", () => {
    const csv = "name,commission\nDJ Test,15";
    const result = parseCSVHeader(csv);
    expect(result.error).toBe("CSV must have an 'email' column");
  });

  it("defaults commission to 15 when invalid", () => {
    const csv = "email,commission\ndj@example.com,abc";
    const result = parseCSVHeader(csv);
    expect(result.rows![0].commission).toBe(15);
  });

  it("skips empty email rows", () => {
    const csv = "email\ndj@example.com\n\ndj2@example.com";
    const result = parseCSVHeader(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("handles case-insensitive headers", () => {
    const csv = "Email,Commission\ndj@example.com,25";
    const result = parseCSVHeader(csv);
    expect(result.error).toBeNull();
    expect(result.rows![0].commission).toBe(25);
  });
});
