import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser, signOut: vi.fn() },
    from: mockFrom,
  })),
}));

function chainSelect(result: { data: unknown; error?: unknown }) {
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue(result);
}

function chainInsert(result: { error: unknown }) {
  mockInsert.mockResolvedValue(result);
}

describe("getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { getProfile } = await import("./actions");
    const result = await getProfile();
    expect(result).toBeNull();
  });

  it("returns profile data for authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const profileData = {
      id: "user-1",
      user_type: "dj",
      display_name: "DJ Shadow",
    };
    chainSelect({ data: profileData });

    const { getProfile } = await import("./actions");
    const result = await getProfile();
    expect(result).toEqual(profileData);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("returns null when profile does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    chainSelect({ data: null, error: { code: "PGRST116" } });

    const { getProfile } = await import("./actions");
    const result = await getProfile();
    expect(result).toBeNull();
  });
});

describe("createProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { createProfile } = await import("./actions");
    const result = await createProfile("dj", "Test DJ");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("inserts profile for authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: null });

    const { createProfile } = await import("./actions");
    const result = await createProfile("dj", "DJ Shadow");

    expect(result).toEqual({ error: null });
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockInsert).toHaveBeenCalledWith({
      id: "user-1",
      user_type: "dj",
      display_name: "DJ Shadow",
    });
  });

  it("returns error message on insert failure", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({
      error: { message: "duplicate key value violates unique constraint" },
    });

    const { createProfile } = await import("./actions");
    const result = await createProfile("dj", "DJ Shadow");

    expect(result).toEqual({
      error: "duplicate key value violates unique constraint",
    });
  });

  it("creates agency record for agency user type", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    // First call: profiles insert, subsequent calls: agency insert
    mockFrom
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

    const { createProfile } = await import("./actions");
    await createProfile("agency", "Holt Booking");

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockFrom).toHaveBeenCalledWith("agencies");
  });

  it("creates venue and venue_contact for venue_contact user type", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const mockVenueInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "venue-1" }, error: null }),
      }),
    });
    const mockContactInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }) // profiles
      .mockReturnValueOnce({ insert: mockVenueInsert }) // venues
      .mockReturnValueOnce({ insert: mockContactInsert }); // venue_contacts

    const { createProfile } = await import("./actions");
    await createProfile("venue_contact", "Nowadays");

    expect(mockFrom).toHaveBeenCalledWith("venues");
    expect(mockFrom).toHaveBeenCalledWith("venue_contacts");
  });

  it("creates promoter record for promoter user type", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

    const { createProfile } = await import("./actions");
    await createProfile("promoter", "Jane Doe");

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockFrom).toHaveBeenCalledWith("promoters");
  });
});
