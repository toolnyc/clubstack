import { describe, it, expect, vi, beforeEach } from "vitest";
import { isPublicPath, updateSession } from "./middleware";

// Mock @supabase/ssr
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// Mock NextResponse to avoid Next.js 16 internal header validation
const mockNextResponse = { status: 200, headers: new Headers() };
const mockRedirect = vi.fn();

vi.mock("next/server", async () => {
  const actual =
    await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    NextResponse: {
      next: () => mockNextResponse,
      redirect: (url: URL) => {
        mockRedirect(url);
        return {
          status: 307,
          headers: new Headers({ location: url.toString() }),
        };
      },
    },
  };
});

function buildRequest(path: string) {
  const url = new URL(path, "http://localhost:3000");
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    headers: new Headers(),
  } as unknown as import("next/server").NextRequest;
}

function chainMockQuery(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue(result);
}

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

  it("treats public DJ profiles as public", () => {
    expect(isPublicPath("/dj/dj-shadow")).toBe(true);
  });

  it("treats contract signing pages as public", () => {
    expect(isPublicPath("/sign/abc-123")).toBe(true);
  });

  it("treats dashboard as protected", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("treats bookings as protected", () => {
    expect(isPublicPath("/bookings")).toBe(false);
  });

  it("treats roster as protected", () => {
    expect(isPublicPath("/roster")).toBe(false);
  });

  it("treats calendar as protected", () => {
    expect(isPublicPath("/calendar")).toBe(false);
  });

  it("treats onboarding as not public (requires auth)", () => {
    expect(isPublicPath("/onboarding")).toBe(false);
  });
});

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  });

  it("allows unauthenticated access to public paths", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await updateSession(buildRequest("/"));
    expect(response).toBe(mockNextResponse);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users from protected routes to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await updateSession(buildRequest("/dashboard"));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/login" })
    );
  });

  it("includes redirect param when redirecting to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await updateSession(buildRequest("/bookings"));
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.searchParams.get("redirect")).toBe("/bookings");
  });

  it("redirects unauthenticated users from onboarding to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await updateSession(buildRequest("/onboarding"));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/login" })
    );
  });

  it("redirects authenticated users from login to dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    await updateSession(buildRequest("/login"));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/dashboard" })
    );
  });

  it("allows authenticated users with profile to access app routes", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    chainMockQuery({ data: { id: "user-1" }, error: null });

    const response = await updateSession(buildRequest("/dashboard"));
    expect(response).toBe(mockNextResponse);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to onboarding when profile is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    chainMockQuery({ data: null, error: null });

    await updateSession(buildRequest("/dashboard"));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/onboarding" })
    );
  });

  it("redirects to onboarding when profiles query errors (e.g. table missing from schema cache)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    chainMockQuery({
      data: null,
      error: {
        message:
          "Could not find the table 'public.profiles' in the schema cache",
        code: "PGRST204",
      },
    });

    await updateSession(buildRequest("/dashboard"));
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/onboarding" })
    );
  });

  it("does not query profiles for onboarding path", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const response = await updateSession(buildRequest("/onboarding"));
    expect(mockFrom).not.toHaveBeenCalled();
    expect(response).toBe(mockNextResponse);
  });
});
