import { supabase } from "./supabase";
import type {
  Booking,
  BookingDate,
  BookingArtist,
  BookingCost,
  CreateBookingInput,
  RosterEntry,
} from "@clubstack/shared";
import type { DealSummary } from "./booking-types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function getToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = await getToken();
  if (!token) return { data: null, error: "Not authenticated" };

  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error ?? `HTTP ${res.status}` };
    }

    return { data: json.data as T, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export interface BookingDetail {
  booking: Booking;
  dates: BookingDate[];
  artists: (BookingArtist & {
    dj_profile: { id: string; name: string; slug: string };
  })[];
  costs: BookingCost[];
}

export async function getBookings() {
  return apiFetch<Booking[]>("/api/bookings");
}

export async function getBooking(id: string) {
  return apiFetch<BookingDetail>(`/api/bookings/${id}`);
}

export async function createBooking(input: CreateBookingInput) {
  return apiFetch<{ bookingId: string }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBookingStatus(id: string, status: string) {
  return apiFetch<{ status: string }>(`/api/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getDealMath(id: string) {
  return apiFetch<DealSummary>(`/api/bookings/${id}/deal-math`);
}

export async function getRoster() {
  return apiFetch<RosterEntry[]>("/api/roster");
}
