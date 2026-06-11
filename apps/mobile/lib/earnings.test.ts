import { afterEach, describe, expect, it } from "vitest";

import { SEEDED, signInAs, signOut } from "../test/helpers";
import { getEarningsHistory, getEarningsSummary } from "./earnings";

const SEEDED_BOOKING_ARTIST_ID = "11111111-1111-2222-3333-111111111111";

afterEach(signOut);

describe("getEarningsSummary", () => {
  it("aggregates the seeded gig for the DJ", async () => {
    await signInAs(SEEDED.djUser);

    const summary = await getEarningsSummary();

    // Seeded gig: fee 1500, commission 15% -> net 1275, draft booking -> upcoming
    expect(summary.gigCount).toBeGreaterThanOrEqual(1);
    expect(summary.totalUpcoming).toBeGreaterThanOrEqual(1275);
    expect(summary.totalEarned).toBe(0);
  });

  it("returns zeros for a user with no DJ profile", async () => {
    await signInAs(SEEDED.agencyUser);

    const summary = await getEarningsSummary();

    expect(summary).toEqual({
      totalEarned: 0,
      totalPending: 0,
      totalUpcoming: 0,
      gigCount: 0,
    });
  });
});

describe("getEarningsHistory", () => {
  it("returns the seeded gig with per-entry math and venue name", async () => {
    await signInAs(SEEDED.djUser);

    const history = await getEarningsHistory();
    const entry = history.find((e) => e.id === SEEDED_BOOKING_ARTIST_ID);

    expect(entry).toBeDefined();
    expect(entry?.fee).toBe(1500);
    expect(entry?.commissionPct).toBe(15);
    expect(entry?.commission).toBe(225);
    expect(entry?.net).toBe(1275);
    expect(entry?.status).toBe("upcoming");
    expect(entry?.eventName).toBe("Test Night");
    expect(entry?.venueName).toBe("The Test Club");
  });
});
