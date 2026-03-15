import { refreshAccessToken } from "./oauth";

const FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface FreeBusyPeriod {
  start: string;
  end: string;
}

interface FreeBusyResponse {
  calendars: Record<
    string,
    { busy: FreeBusyPeriod[]; errors?: { reason: string }[] }
  >;
}

interface BusyDay {
  date: string;
  status: "busy";
}

/**
 * Get a valid access token, refreshing if expired.
 */
async function getValidToken(connection: {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}): Promise<{ access_token: string; refreshed: boolean; expires_at: Date }> {
  const expiresAt = new Date(connection.token_expires_at);

  // Refresh if less than 5 minutes until expiry
  if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const tokens = await refreshAccessToken(connection.refresh_token);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    return {
      access_token: tokens.access_token,
      refreshed: true,
      expires_at: newExpiresAt,
    };
  }

  return {
    access_token: connection.access_token,
    refreshed: false,
    expires_at: expiresAt,
  };
}

/**
 * Fetch free/busy data from Google Calendar API.
 */
async function fetchFreeBusy(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<BusyDay[]> {
  const res = await fetch(FREEBUSY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    throw new Error(`FreeBusy API error: ${res.status}`);
  }

  const data: FreeBusyResponse = await res.json();
  const calendar = data.calendars[calendarId];

  if (!calendar || calendar.errors?.length) {
    throw new Error("Calendar not accessible");
  }

  // Convert busy periods to busy days
  const busyDays = new Set<string>();
  for (const period of calendar.busy) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    while (current < end) {
      busyDays.add(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  return Array.from(busyDays).map((date) => ({
    date,
    status: "busy" as const,
  }));
}

/**
 * Check if cached data is still fresh.
 */
function isCacheFresh(cachedAt: string | Date): boolean {
  const cached = new Date(cachedAt);
  return Date.now() - cached.getTime() < CACHE_TTL_MS;
}

export { getValidToken, fetchFreeBusy, isCacheFresh, CACHE_TTL_MS };
export type { FreeBusyPeriod, BusyDay };
