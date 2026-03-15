import { describe, it, expect } from "vitest";
import { parseICS, unfoldLines } from "./ics-parser";

const MINIMAL_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260315T210000Z
SUMMARY:DJ Set at Berghain
END:VEVENT
END:VCALENDAR`;

const MULTI_EVENT_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260315T210000Z
SUMMARY:Friday gig
END:VEVENT
BEGIN:VEVENT
DTSTART:20260322T230000Z
SUMMARY:Saturday gig
END:VEVENT
BEGIN:VEVENT
DTSTART:20260401T190000Z
END:VEVENT
END:VCALENDAR`;

const DATE_ONLY_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260410
SUMMARY:All day block
END:VEVENT
END:VCALENDAR`;

const TZID_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;TZID=America/New_York:20260501T200000
SUMMARY:NYC show
END:VEVENT
END:VCALENDAR`;

describe("parseICS", () => {
  it("parses a minimal single-event ICS", () => {
    const events = parseICS(MINIMAL_ICS);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe("2026-03-15");
    expect(events[0].summary).toBe("DJ Set at Berghain");
  });

  it("parses multiple events", () => {
    const events = parseICS(MULTI_EVENT_ICS);
    expect(events).toHaveLength(3);
    expect(events[0].date).toBe("2026-03-15");
    expect(events[1].date).toBe("2026-03-22");
    expect(events[2].date).toBe("2026-04-01");
    expect(events[2].summary).toBeNull();
  });

  it("parses VALUE=DATE format", () => {
    const events = parseICS(DATE_ONLY_ICS);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe("2026-04-10");
  });

  it("parses TZID format", () => {
    const events = parseICS(TZID_ICS);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe("2026-05-01");
    expect(events[0].summary).toBe("NYC show");
  });

  it("returns empty array for empty input", () => {
    expect(parseICS("")).toEqual([]);
  });

  it("returns empty array for ICS with no events", () => {
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR`;
    expect(parseICS(ics)).toEqual([]);
  });

  it("skips events without DTSTART", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:No date
END:VEVENT
END:VCALENDAR`;
    expect(parseICS(ics)).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    const ics =
      "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20260315T210000Z\r\nEND:VEVENT\r\nEND:VCALENDAR";
    const events = parseICS(ics);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe("2026-03-15");
  });
});

describe("unfoldLines", () => {
  it("joins continuation lines starting with space", () => {
    const result = unfoldLines("SUMM\n ARY:test");
    expect(result).toEqual(["SUMMARY:test"]);
  });

  it("joins continuation lines starting with tab", () => {
    const result = unfoldLines("SUMM\n\tARY:test");
    expect(result).toEqual(["SUMMARY:test"]);
  });

  it("handles text with no folding", () => {
    const result = unfoldLines("LINE1\nLINE2");
    expect(result).toEqual(["LINE1", "LINE2"]);
  });

  it("handles CRLF", () => {
    const result = unfoldLines("LINE1\r\n LINE1CONT\r\nLINE2");
    expect(result).toEqual(["LINE1LINE1CONT", "LINE2"]);
  });
});
