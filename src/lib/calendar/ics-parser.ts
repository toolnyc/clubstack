/**
 * Pure ICS (iCalendar) parser.
 * Extracts VEVENT DTSTART dates from ICS text and returns them
 * as ISO date strings (YYYY-MM-DD).
 */

interface ParsedEvent {
  date: string;
  summary: string | null;
}

function parseDtstartValue(value: string): string | null {
  // Handle DTSTART;VALUE=DATE:20260315 or DTSTART:20260315T120000Z
  const cleaned = value.replace(/^.*:/, "").trim();

  // DATE format: YYYYMMDD
  const dateMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dateMatch) return null;

  const [, year, month, day] = dateMatch;
  return `${year}-${month}-${day}`;
}

function parseICS(text: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const lines = unfoldLines(text);

  let inEvent = false;
  let currentDate: string | null = null;
  let currentSummary: string | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      currentDate = null;
      currentSummary = null;
      continue;
    }

    if (line === "END:VEVENT") {
      if (inEvent && currentDate) {
        events.push({ date: currentDate, summary: currentSummary });
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    // DTSTART can appear as:
    //   DTSTART:20260315T120000Z
    //   DTSTART;VALUE=DATE:20260315
    //   DTSTART;TZID=America/New_York:20260315T120000
    if (line.startsWith("DTSTART")) {
      currentDate = parseDtstartValue(line);
    }

    if (line.startsWith("SUMMARY:")) {
      currentSummary = line.slice("SUMMARY:".length).trim();
    }
  }

  return events;
}

/**
 * Unfold ICS continuation lines.
 * Per RFC 5545, long lines are folded by inserting CRLF + whitespace.
 * This function joins them back together.
 */
function unfoldLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      // Continuation of previous line
      if (lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      }
    } else {
      lines.push(line);
    }
  }

  return lines;
}

export { parseICS, unfoldLines };
export type { ParsedEvent };
