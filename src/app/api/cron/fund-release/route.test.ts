import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) {
    headers["authorization"] = authHeader;
  }
  return new NextRequest("http://localhost/api/cron/fund-release", {
    headers,
  });
}

describe("GET /api/cron/fund-release", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
  });

  it("returns 401 when no Authorization header is present", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header has wrong secret", async () => {
    const response = await GET(makeRequest("Bearer wrong-secret"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header is missing Bearer prefix", async () => {
    const response = await GET(makeRequest("test-cron-secret"));
    expect(response.status).toBe(401);
  });

  it("returns 401 when Authorization header is empty string", async () => {
    const response = await GET(makeRequest(""));
    expect(response.status).toBe(401);
  });

  it("returns 200 with valid Bearer token", async () => {
    const response = await GET(makeRequest("Bearer test-cron-secret"));
    expect(response.status).toBe(200);
  });

  it("returns ok:true with valid auth", async () => {
    const response = await GET(makeRequest("Bearer test-cron-secret"));
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns ran timestamp with valid auth", async () => {
    const before = Date.now();
    const response = await GET(makeRequest("Bearer test-cron-secret"));
    const after = Date.now();
    const body = await response.json();

    expect(body.ran).toBeDefined();
    const ranTime = new Date(body.ran).getTime();
    expect(ranTime).toBeGreaterThanOrEqual(before);
    expect(ranTime).toBeLessThanOrEqual(after);
  });

  it("returns 401 when a different valid-looking token is provided", async () => {
    const response = await GET(
      makeRequest("Bearer test-cron-secret-but-wrong")
    );
    expect(response.status).toBe(401);
  });
});
