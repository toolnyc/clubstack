import { describe, it, expect, vi } from "vitest";
import { buildAuthUrl, SCOPES } from "./oauth";

describe("buildAuthUrl", () => {
  it("builds a Google OAuth URL with correct params", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    const url = buildAuthUrl("user-123");
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    expect(parsed.searchParams.get("client_id")).toBe("test-client-id");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("access_type")).toBe("offline");
    expect(parsed.searchParams.get("prompt")).toBe("consent");
    expect(parsed.searchParams.get("state")).toBe("user-123");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/calendar/callback"
    );

    vi.unstubAllEnvs();
  });

  it("uses only freebusy scope", () => {
    expect(SCOPES).toEqual([
      "https://www.googleapis.com/auth/calendar.freebusy",
    ]);
  });
});
