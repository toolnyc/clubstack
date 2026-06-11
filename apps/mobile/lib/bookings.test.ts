import { afterEach, describe, expect, it } from "vitest";

import { SEEDED, signInAs, signOut } from "../test/helpers";
import {
  addCost,
  createBooking,
  getBooking,
  getBookings,
  removeCost,
  updateCost,
} from "./bookings";
import { supabase } from "./supabase";

afterEach(signOut);

describe("getBookings", () => {
  it("lists the seeded booking for its creator", async () => {
    await signInAs(SEEDED.agencyUser);

    const bookings = await getBookings();

    expect(bookings.some((b) => b.id === SEEDED.bookingId)).toBe(true);
  });

  it("returns nothing when signed out", async () => {
    expect(await getBookings()).toEqual([]);
  });
});

describe("getBooking", () => {
  it("returns the full aggregate with dates and artists", async () => {
    await signInAs(SEEDED.agencyUser);

    const detail = await getBooking(SEEDED.bookingId);

    expect(detail.booking.status).toBeDefined();
    expect(detail.dates.length).toBeGreaterThan(0);
    expect(detail.artists.length).toBeGreaterThan(0);
    expect(detail.artists[0].dj_profile.name).toBe("DJ Testwave");
  });

  it("throws for a booking hidden by RLS", async () => {
    await expect(getBooking(SEEDED.bookingId)).rejects.toThrow(
      "Booking not found"
    );
  });
});

describe("costs", () => {
  it("creator can add, update, and remove a cost", async () => {
    await signInAs(SEEDED.agencyUser);

    const cost = await addCost(SEEDED.bookingId, {
      description: "test cost",
      amount: 100,
      category: "travel",
    });
    expect(cost.amount).toBe(100);

    const updated = await updateCost(cost.id, { amount: 150 });
    expect(updated.amount).toBe(150);

    await removeCost(cost.id);
    const detail = await getBooking(SEEDED.bookingId);
    expect(detail.costs.some((c) => c.id === cost.id)).toBe(false);
  });

  it("RLS blocks a non-creator from adding a cost", async () => {
    await signInAs(SEEDED.djUser);

    await expect(
      addCost(SEEDED.bookingId, { description: "sneaky", amount: 1 })
    ).rejects.toThrow();
  });
});

describe("createBooking", () => {
  it("creates the aggregate and returns the booking id", async () => {
    await signInAs(SEEDED.agencyUser);

    const bookingId = await createBooking({
      booking: { payer_type: "promoter", notes: "integration test booking" },
      dates: [{ date: "2030-01-01", event_name: "Test Create Night" }],
      artists: [
        {
          dj_profile_id: SEEDED.djProfileId,
          fee: 1000,
          commission_pct: 15,
          payment_split_pct: 100,
        },
      ],
      costs: [{ description: "van", amount: 50, category: "travel" }],
    });

    try {
      const detail = await getBooking(bookingId);
      expect(detail.booking.status).toBe("draft");
      expect(detail.dates[0].event_name).toBe("Test Create Night");
      expect(detail.artists[0].fee).toBe(1000);
      expect(detail.costs[0].description).toBe("van");
    } finally {
      await supabase.from("bookings").delete().eq("id", bookingId);
    }
  });
});
