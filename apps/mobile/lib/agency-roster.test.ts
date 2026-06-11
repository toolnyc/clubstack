import { afterEach, describe, expect, it } from "vitest";

import { SEEDED, signInAs, signOut } from "../test/helpers";
import { getMyRoster, getRoster } from "./agency-roster";

afterEach(signOut);

describe("getMyRoster", () => {
  it("returns the seeded roster for the agency user", async () => {
    await signInAs(SEEDED.agencyUser);

    const roster = await getMyRoster();

    const entry = roster.find(
      (r) => r.dj_profile_id === SEEDED.djProfileId
    );
    expect(entry).toBeDefined();
    expect(entry?.status).toBe("active");
    expect(entry?.dj_profile.name).toBe("DJ Testwave");
  });

  it("returns empty for a user without an agency", async () => {
    await signInAs(SEEDED.djUser);

    expect(await getMyRoster()).toEqual([]);
  });

  it("returns empty when signed out", async () => {
    expect(await getMyRoster()).toEqual([]);
  });
});

describe("roster RLS", () => {
  it("hides the agency roster from an unrelated promoter", async () => {
    await signInAs(SEEDED.promoterUser);

    expect(await getRoster(SEEDED.agencyId)).toEqual([]);
  });
});
