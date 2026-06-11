import { supabase } from "./supabase";
import type {
  Booking,
  BookingDate,
  BookingArtist,
  BookingCost,
  BookingTravel,
  Contract,
  ContractClause,
  CostCategory,
  CreateBookingInput,
  DealSummary,
  Message,
  SignatureConfig,
  Thread,
} from "@clubstack/shared";

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

// --- Contract ---

export interface ContractDetail {
  contract: Contract;
  clauses: ContractClause[];
}

export async function getContract(bookingId: string) {
  return apiFetch<ContractDetail | null>(`/api/bookings/${bookingId}/contract`);
}

export async function createContract(bookingId: string) {
  return apiFetch<ContractDetail>(`/api/bookings/${bookingId}/contract`, {
    method: "POST",
  });
}

export async function updateSignatureConfig(
  bookingId: string,
  signatureConfig: SignatureConfig
) {
  return apiFetch<Contract>(`/api/bookings/${bookingId}/contract`, {
    method: "PATCH",
    body: JSON.stringify({ signature_config: signatureConfig }),
  });
}

export async function updateClause(
  bookingId: string,
  clauseId: string,
  updates: { is_enabled?: boolean; content?: string }
) {
  return apiFetch<ContractClause>(
    `/api/bookings/${bookingId}/contract/clauses/${clauseId}`,
    { method: "PATCH", body: JSON.stringify(updates) }
  );
}

export async function sendContractForSignature(bookingId: string) {
  return apiFetch<{ signingUrl: string }>(
    `/api/bookings/${bookingId}/contract/send`,
    { method: "POST" }
  );
}

// --- Stripe Connect ---

export interface StripeConnectStatus {
  accountId: string | null;
  status: "not_started" | "pending" | "active" | "restricted";
}

export async function createStripeConnect() {
  return apiFetch<{ url: string }>("/api/mobile/stripe/connect", {
    method: "POST",
  });
}

export async function getStripeConnectStatus() {
  return apiFetch<StripeConnectStatus>("/api/mobile/stripe/status");
}

// --- Payer Payment Setup ---

export interface PayerPaymentStatus {
  hasPaymentMethod: boolean;
  customerId: string | null;
  card: { brand: string; last4: string } | null;
}

export async function createPaymentSetup() {
  return apiFetch<{ url: string }>("/api/mobile/stripe/customer", {
    method: "POST",
  });
}

export async function getPayerPaymentStatus() {
  return apiFetch<PayerPaymentStatus>("/api/mobile/stripe/customer");
}

// --- Payment Capture ---

export interface PaymentRecord {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string | null;
  type: "deposit" | "balance";
  amount: number;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  scheduled_date: string | null;
  processed_at: string | null;
  created_at: string;
}

export async function chargeDeposit(bookingId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/mobile/bookings/${bookingId}/charge-deposit`,
    { method: "POST" }
  );
}

export async function chargeBalance(bookingId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/mobile/bookings/${bookingId}/charge-balance`,
    { method: "POST" }
  );
}

export async function getBookingPayments(bookingId: string) {
  return apiFetch<PaymentRecord[]>(
    `/api/mobile/bookings/${bookingId}/payments`
  );
}

// --- Earnings ---

export interface EarningsSummary {
  totalEarned: number;
  totalPending: number;
  totalUpcoming: number;
  gigCount: number;
}

export interface EarningsEntry {
  id: string;
  date: string;
  eventName: string | null;
  venueName: string | null;
  fee: number;
  commissionPct: number;
  commission: number;
  net: number;
  status: "completed" | "pending" | "upcoming" | "cancelled";
}

export async function getEarningsSummary() {
  return apiFetch<EarningsSummary>("/api/mobile/earnings/summary");
}

export async function getEarningsHistory() {
  return apiFetch<EarningsEntry[]>("/api/mobile/earnings/history");
}

// --- Invoices ---

export interface InvoiceListEntry {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "void";
  dueDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  bookingId: string;
  venueName: string | null;
  eventName: string | null;
  bookingDate: string | null;
}

export interface InvoiceDetail {
  invoice: {
    id: string;
    booking_id: string;
    invoice_number: string;
    total_amount: number;
    currency: string;
    status: string;
    due_date: string | null;
    sent_at: string | null;
    paid_at: string | null;
    created_at: string;
  };
  lineItems: {
    id: string;
    description: string;
    amount: number;
    category: string;
  }[];
}

export async function generateInvoice(bookingId: string) {
  return apiFetch<{ invoiceId: string }>(
    `/api/mobile/bookings/${bookingId}/invoice`,
    { method: "POST" }
  );
}

export async function getAllInvoices() {
  return apiFetch<InvoiceListEntry[]>("/api/mobile/invoices");
}

export async function getInvoice(invoiceId: string) {
  return apiFetch<InvoiceDetail>(`/api/mobile/invoices/${invoiceId}`);
}
