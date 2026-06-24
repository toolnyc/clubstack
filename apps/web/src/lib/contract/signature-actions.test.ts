import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FeeLine } from "@clubstack/shared";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockGetContractTerms = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("./terms-actions", () => ({
  getContractTerms: (...args: unknown[]) => mockGetContractTerms(...args),
}));

const TERMS: FeeLine[] = [
  {
    description: "Performance fee",
    amount: 1000,
    payees: [
      {
        recipient_user_id: "user-dj",
        role_label: "performer",
        priority: 0,
        entitlement: { kind: "pct", value: 100 },
      },
    ],
  },
];

// A chainable builder: select/insert/update/delete/in/order all chain; eq is
// awaitable AND exposes .single() so both `await ...eq()` and `...eq().single()`
// work off one shape.
function makeBuilder(handlers: {
  insert?: unknown;
  single?: unknown;
  eq?: unknown;
}) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => Promise.resolve({ data: [] }));
  builder.insert = vi.fn(() =>
    Promise.resolve(handlers.insert ?? { error: null })
  );
  builder.update = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(handlers.single ?? { data: null }));
  builder.eq = vi.fn(() => {
    const p = Promise.resolve(
      handlers.eq ?? { data: [], error: null }
    ) as Promise<unknown> & { single?: () => Promise<unknown> };
    p.single = () => Promise.resolve(handlers.single ?? { data: null });
    return p;
  });
  return builder;
}

function wire(contractRow: Record<string, unknown>) {
  const updateSpy = vi.fn(() => contractsBuilder);
  const contractsBuilder = makeBuilder({
    single: { data: contractRow },
    eq: { error: null },
  });
  contractsBuilder.update = updateSpy;

  mockFrom.mockImplementation((table: string) => {
    if (table === "contracts") return contractsBuilder;
    if (table === "contract_signatures") {
      return makeBuilder({
        insert: { error: null },
        eq: { data: [{ signer_role: "agency" }] },
      });
    }
    return makeBuilder({});
  });

  return updateSpy;
}

describe("signContract terms freeze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-agency" } } });
    mockGetContractTerms.mockResolvedValue(TERMS);
  });

  const baseInput = {
    contractId: "contract-1",
    signerRole: "agency" as const,
    signerName: "Agency",
    signerEmail: "agency@example.com",
    signatureData: "data",
    signatureType: "typed" as const,
  };

  it("freezes terms_snapshot when contract becomes fully signed and none exists", async () => {
    const updateSpy = wire({
      id: "contract-1",
      signature_config: "agency_only",
      terms_snapshot: null,
    });

    const { signContract } = await import("./signature-actions");
    const result = await signContract(baseInput);

    expect(result.error).toBeNull();
    expect(mockGetContractTerms).toHaveBeenCalledWith("contract-1");

    const updateArg = (updateSpy.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(updateArg.status).toBe("signed");
    expect(updateArg.terms_snapshot).toMatchObject({
      version: 1,
      fee_lines: [{ description: "Performance fee", amount: 1000 }],
    });
  });

  it("does not overwrite an existing terms_snapshot (freeze-once)", async () => {
    const updateSpy = wire({
      id: "contract-1",
      signature_config: "agency_only",
      terms_snapshot: { version: 1, frozen_at: "earlier", fee_lines: [] },
    });

    const { signContract } = await import("./signature-actions");
    const result = await signContract(baseInput);

    expect(result.error).toBeNull();
    expect(mockGetContractTerms).not.toHaveBeenCalled();

    const updateArg = (updateSpy.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(updateArg.status).toBe("signed");
    expect("terms_snapshot" in updateArg).toBe(false);
  });
});
