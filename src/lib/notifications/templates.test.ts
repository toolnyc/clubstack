import { describe, it, expect } from "vitest";
import { getTemplate, TEMPLATE_MAP } from "./templates";
import type { NotificationType } from "@/types";

const ALL_TYPES: NotificationType[] = [
  "contract_sent",
  "contract_signed",
  "payment_received",
  "payment_due",
  "booking_confirmed",
  "calendar_conflict",
  "agency_invite",
];

describe("notification templates", () => {
  it("has a template for every notification type", () => {
    expect(Object.keys(TEMPLATE_MAP)).toHaveLength(ALL_TYPES.length);
    for (const type of ALL_TYPES) {
      expect(TEMPLATE_MAP[type]).toBeDefined();
    }
  });

  it.each(ALL_TYPES)("template %s returns subject and html", (type) => {
    const result = getTemplate(type, {});
    expect(result.subject).toBeTruthy();
    expect(typeof result.subject).toBe("string");
    expect(result.html).toBeTruthy();
    expect(typeof result.html).toBe("string");
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("contract_sent interpolates event name and venue", () => {
    const result = getTemplate("contract_sent", {
      eventName: "Warehouse Sessions",
      venueName: "Basement NYC",
      eventDate: "2026-04-15",
    });
    expect(result.subject).toContain("Warehouse Sessions");
    expect(result.html).toContain("Warehouse Sessions");
    expect(result.html).toContain("Basement NYC");
    expect(result.html).toContain("2026-04-15");
  });

  it("contract_signed interpolates event name", () => {
    const result = getTemplate("contract_signed", {
      eventName: "Friday Night",
      venueName: "Club Output",
    });
    expect(result.subject).toContain("Friday Night");
    expect(result.html).toContain("Club Output");
  });

  it("payment_received interpolates amount", () => {
    const result = getTemplate("payment_received", {
      amount: "$1,500",
      eventName: "Summer Set",
    });
    expect(result.subject).toContain("$1,500");
    expect(result.html).toContain("$1,500");
    expect(result.html).toContain("Summer Set");
  });

  it("payment_due interpolates due date and amount", () => {
    const result = getTemplate("payment_due", {
      amount: "$2,000",
      dueDate: "2026-05-01",
      eventName: "May Day Rave",
    });
    expect(result.subject).toContain("2026-05-01");
    expect(result.html).toContain("$2,000");
    expect(result.html).toContain("2026-05-01");
  });

  it("booking_confirmed interpolates event and venue", () => {
    const result = getTemplate("booking_confirmed", {
      eventName: "Deep House Sunday",
      venueName: "Nowadays",
      eventDate: "2026-06-01",
    });
    expect(result.subject).toContain("Deep House Sunday");
    expect(result.html).toContain("Nowadays");
    expect(result.html).toContain("2026-06-01");
  });

  it("calendar_conflict interpolates conflict date", () => {
    const result = getTemplate("calendar_conflict", {
      conflictDate: "2026-04-20",
      conflictDetails: "Double-booked with Warehouse party",
    });
    expect(result.subject).toContain("2026-04-20");
    expect(result.html).toContain("2026-04-20");
    expect(result.html).toContain("Double-booked with Warehouse party");
  });

  it("agency_invite interpolates agency name", () => {
    const result = getTemplate("agency_invite", {
      agencyName: "Nonchalant Bookings",
    });
    expect(result.subject).toContain("Nonchalant Bookings");
    expect(result.html).toContain("Nonchalant Bookings");
  });

  it("includes contract URL when provided", () => {
    const result = getTemplate("contract_sent", {
      contractUrl: "https://clubstack.com/contracts/abc",
    });
    expect(result.html).toContain("https://clubstack.com/contracts/abc");
    expect(result.html).toContain("Review");
  });

  it("handles missing optional data gracefully", () => {
    for (const type of ALL_TYPES) {
      const result = getTemplate(type, {});
      expect(result.subject).toBeTruthy();
      expect(result.html).toContain("ClubStack");
    }
  });
});
