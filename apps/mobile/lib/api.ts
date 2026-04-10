import { supabase } from "./supabase";
import type {
  Booking,
  BookingDate,
  BookingArtist,
  BookingCost,
  BookingTravel,
  CostCategory,
  CreateBookingInput,
  Message,
  RosterEntry,
  Thread,
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
  travel: BookingTravel[];
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

// --- Costs CRUD ---

export async function getCosts(bookingId: string) {
  return apiFetch<BookingCost[]>(`/api/bookings/${bookingId}/costs`);
}

export async function addCost(
  bookingId: string,
  input: { description: string; amount: number; category?: CostCategory | null }
) {
  return apiFetch<BookingCost>(`/api/bookings/${bookingId}/costs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCost(
  bookingId: string,
  costId: string,
  input: {
    description?: string;
    amount?: number;
    category?: CostCategory | null;
  }
) {
  return apiFetch<BookingCost>(`/api/bookings/${bookingId}/costs/${costId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function removeCost(bookingId: string, costId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/bookings/${bookingId}/costs/${costId}`,
    { method: "DELETE" }
  );
}

// --- Travel CRUD ---

export async function getTravel(bookingId: string) {
  return apiFetch<BookingTravel[]>(`/api/bookings/${bookingId}/travel`);
}

export async function addTravel(
  bookingId: string,
  input: Record<string, unknown>
) {
  return apiFetch<BookingTravel>(`/api/bookings/${bookingId}/travel`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTravel(
  bookingId: string,
  travelId: string,
  input: Record<string, unknown>
) {
  return apiFetch<BookingTravel>(
    `/api/bookings/${bookingId}/travel/${travelId}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function removeTravel(bookingId: string, travelId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/bookings/${bookingId}/travel/${travelId}`,
    { method: "DELETE" }
  );
}

// --- Thread / Messages ---

export type MessageWithSender = Message & {
  sender: { full_name: string } | null;
};

export interface ThreadDetail {
  thread: Thread;
  messages: MessageWithSender[];
}

export async function getThread(bookingId: string) {
  return apiFetch<ThreadDetail>(`/api/bookings/${bookingId}/thread`);
}

export async function sendMessage(bookingId: string, content: string) {
  return apiFetch<MessageWithSender>(
    `/api/bookings/${bookingId}/thread/messages`,
    { method: "POST", body: JSON.stringify({ content }) }
  );
}
