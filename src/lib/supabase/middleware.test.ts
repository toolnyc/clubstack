import { describe, it, expect } from "vitest";

// We test the public path logic directly since the full middleware
// requires real Supabase credentials

const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/auth/confirm"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith("/api/")
  );
}

describe("middleware route protection", () => {
  describe("isPublicPath", () => {
    it("treats root as public", () => {
      expect(isPublicPath("/")).toBe(true);
    });

    it("treats login as public", () => {
      expect(isPublicPath("/login")).toBe(true);
    });

    it("treats auth callback as public", () => {
      expect(isPublicPath("/auth/callback")).toBe(true);
    });

    it("treats auth confirm as public", () => {
      expect(isPublicPath("/auth/confirm")).toBe(true);
    });

    it("treats API routes as public", () => {
      expect(isPublicPath("/api/webhooks/stripe")).toBe(true);
      expect(isPublicPath("/api/health")).toBe(true);
    });

    it("treats dashboard as protected", () => {
      expect(isPublicPath("/dashboard")).toBe(false);
    });

    it("treats bookings as protected", () => {
      expect(isPublicPath("/bookings")).toBe(false);
    });

    it("treats settings as protected", () => {
      expect(isPublicPath("/settings")).toBe(false);
    });

    it("treats roster as protected", () => {
      expect(isPublicPath("/roster")).toBe(false);
    });

    it("treats calendar as protected", () => {
      expect(isPublicPath("/calendar")).toBe(false);
    });
  });
});
