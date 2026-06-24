import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

function wireContract(contractRow: unknown) {
  const single = vi.fn(() => Promise.resolve({ data: contractRow }));
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const deleteFn = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
  mockFrom.mockReturnValue({ select, delete: deleteFn });
  return { deleteFn };
}

const VALID_LINE = {
  description: "Performance fee",
  amount: 1000,
  payees: [
    {
      recipient_user_id: "11111111-1111-1111-1111-111111111111",
      role_label: "performer",
      entitlement_kind: "pct" as const,
      entitlement_value: 100,
      priority: 0,
    },
  ],
};

describe("setContractTerms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("rejects editing the terms of a signed contract", async () => {
    const { deleteFn } = wireContract({ id: "c1", status: "signed" });

    const { setContractTerms } = await import("./terms-actions");
    const result = await setContractTerms("c1", [VALID_LINE]);

    expect(result.error).toBe("Cannot edit terms of a signed contract");
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it("returns not-found when the contract is missing", async () => {
    wireContract(null);

    const { setContractTerms } = await import("./terms-actions");
    const result = await setContractTerms("missing", [VALID_LINE]);

    expect(result.error).toBe("Contract not found");
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { setContractTerms } = await import("./terms-actions");
    const result = await setContractTerms("c1", [VALID_LINE]);

    expect(result.error).toBe("Not authenticated");
  });
});
