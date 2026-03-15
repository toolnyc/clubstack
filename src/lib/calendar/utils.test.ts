import { describe, it, expect } from "vitest";
import {
  getMonthDays,
  getMonthGridDays,
  formatDateShort,
  formatDateLong,
  toDateString,
  isToday,
  isSameMonth,
} from "./utils";

describe("getMonthDays", () => {
  it("returns correct days for March 2026", () => {
    const days = getMonthDays(2026, 2); // March
    expect(days).toHaveLength(31);
    expect(days[0].getDate()).toBe(1);
    expect(days[30].getDate()).toBe(31);
  });

  it("returns correct days for February 2026", () => {
    const days = getMonthDays(2026, 1);
    expect(days).toHaveLength(28);
  });
});

describe("getMonthGridDays", () => {
  it("returns 7-column aligned grid", () => {
    const days = getMonthGridDays(2026, 2);
    expect(days.length % 7).toBe(0);
  });

  it("starts on Sunday", () => {
    const days = getMonthGridDays(2026, 2);
    expect(days[0].getDay()).toBe(0);
  });
});

describe("formatDateShort", () => {
  it("formats as 'Mon DD'", () => {
    const result = formatDateShort(new Date(2026, 2, 22));
    expect(result).toBe("Mar 22");
  });
});

describe("formatDateLong", () => {
  it("formats as 'Month DD, YYYY'", () => {
    const result = formatDateLong(new Date(2026, 2, 22));
    expect(result).toBe("March 22, 2026");
  });
});

describe("toDateString", () => {
  it("returns YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 2, 22))).toMatch(/2026-03-22/);
  });
});

describe("isToday", () => {
  it("returns true for today", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("returns false for another day", () => {
    expect(isToday(new Date(2020, 0, 1))).toBe(false);
  });
});

describe("isSameMonth", () => {
  it("returns true for same month", () => {
    expect(isSameMonth(new Date(2026, 2, 15), 2)).toBe(true);
  });

  it("returns false for different month", () => {
    expect(isSameMonth(new Date(2026, 1, 28), 2)).toBe(false);
  });
});
