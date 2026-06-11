import { afterEach, describe, expect, it } from "vitest";

import { SEEDED, signInAs, signOut } from "../test/helpers";
import { getThread, sendMessage } from "./booking-thread";
import { supabase } from "./supabase";

afterEach(signOut);

describe("getThread", () => {
  it("returns the seeded thread for a booking participant", async () => {
    await signInAs(SEEDED.agencyUser);

    const detail = await getThread(SEEDED.bookingId);

    expect(detail.thread.booking_id).toBe(SEEDED.bookingId);
    expect(Array.isArray(detail.messages)).toBe(true);
  });

  it("RLS blocks a user without booking access", async () => {
    await signInAs(SEEDED.venueUser);

    await expect(getThread(SEEDED.bookingId)).rejects.toThrow();
  });
});

describe("sendMessage", () => {
  it("inserts a message with the sender's display name", async () => {
    await signInAs(SEEDED.agencyUser);

    const message = await sendMessage(SEEDED.bookingId, "  test message  ");

    try {
      expect(message.content).toBe("test message");
      expect(message.sender?.display_name).toBe("Test Agency User");

      const detail = await getThread(SEEDED.bookingId);
      expect(detail.messages.some((m) => m.id === message.id)).toBe(true);
    } finally {
      await supabase.from("messages").delete().eq("id", message.id);
    }
  });

  it("throws when signed out", async () => {
    await expect(sendMessage(SEEDED.bookingId, "nope")).rejects.toThrow(
      "Not authenticated"
    );
  });
});
