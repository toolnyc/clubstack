import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isCacheFresh, CACHE_TTL_MS } from "./calendar";

describe("isCacheFresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns true for recent cache", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    const cachedAt = new Date("2026-03-15T11:50:00Z"); // 10 min ago
    expect(isCacheFresh(cachedAt)).toBe(true);
  });

  it("returns false for stale cache", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    const cachedAt = new Date("2026-03-15T11:40:00Z"); // 20 min ago
    expect(isCacheFresh(cachedAt)).toBe(false);
  });

  it("returns true at exactly TTL boundary", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    const cachedAt = new Date(Date.now() - CACHE_TTL_MS + 1);
    expect(isCacheFresh(cachedAt)).toBe(true);
  });

  it("accepts string dates", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    expect(isCacheFresh("2026-03-15T11:50:00Z")).toBe(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
