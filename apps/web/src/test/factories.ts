import type {
  Booking,
  BookingTravel,
  Invoice,
  InvoiceLineItem,
  ContractClause,
  Message,
} from "@/types";
import type {
  EarningsSummary,
  EarningsEntry,
} from "@/lib/payments/earnings-actions";
import type { Itinerary } from "@/lib/booking/itinerary-actions";

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b-1",
    created_by: "user-1",
    venue_id: "v-1",
    promoter_id: null,
    status: "draft",
    payer_type: "venue",
    payer_user_id: "user-2",
    notes: null,
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
    ...overrides,
  };
}

export function buildTravel(
  overrides: Partial<BookingTravel> = {}
): BookingTravel {
  return {
    id: "travel-1",
    booking_id: "booking-abc-123",
    type: "flight",
    airline: "Delta",
    flight_number: "DL 420",
    departure_airport: "JFK",
    arrival_airport: "LAX",
    departure_time: "2026-04-10T08:00:00Z",
    arrival_time: "2026-04-10T11:30:00Z",
    hotel_name: null,
    hotel_address: null,
    check_in: null,
    check_out: null,
    transport_details: null,
    notes: "Window seat preferred",
    cost: 350,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

export function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    booking_id: "booking-1",
    invoice_number: "CS-20260315-AB12",
    total_amount: 2500,
    currency: "usd",
    status: "draft",
    due_date: null,
    sent_at: null,
    paid_at: null,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

export function buildLineItem(
  overrides: Partial<InvoiceLineItem> = {}
): InvoiceLineItem {
  return {
    id: "li-1",
    invoice_id: "inv-1",
    description: "Performance fee — DJ Shadow",
    amount: 2000,
    category: "fee",
    created_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

export function buildClause(
  overrides: Partial<ContractClause> = {}
): ContractClause {
  return {
    id: "clause-1",
    contract_id: "contract-1",
    clause_type: "parties",
    title: "Parties & Event Details",
    content: "This agreement is entered into...",
    is_enabled: true,
    sort_order: 0,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    thread_id: "thread-1",
    sender_id: "user-1",
    content: "Hello there",
    is_system: false,
    created_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

export function buildEarningsSummary(
  overrides: Partial<EarningsSummary> = {}
): EarningsSummary {
  return {
    totalEarned: 12500,
    totalPending: 3000,
    totalUpcoming: 1500,
    gigCount: 25,
    ...overrides,
  };
}

export function buildEarningsEntry(
  overrides: Partial<EarningsEntry> = {}
): EarningsEntry {
  return {
    id: "ea-1",
    date: "2026-03-01",
    eventName: "Warehouse Party",
    venueName: "The Loft",
    fee: 1000,
    commissionPct: 15,
    commission: 150,
    net: 850,
    status: "completed",
    ...overrides,
  };
}

export function buildItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    booking: {
      id: "b1",
      created_by: "u1",
      venue_id: "v1",
      promoter_id: null,
      status: "signed",
      payer_type: "venue",
      payer_user_id: null,
      notes: null,
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-01T00:00:00Z",
    },
    dates: [
      {
        id: "d1",
        booking_id: "b1",
        date: "2026-04-15",
        set_time: "23:00",
        load_in_time: "20:00",
        event_name: "Friday Residency",
        created_at: "2026-04-01T00:00:00Z",
      },
    ],
    artists: [
      {
        id: "a1",
        booking_id: "b1",
        dj_profile_id: "dj1",
        fee: 1500,
        commission_pct: 15,
        payment_split_pct: 100,
        created_at: "2026-04-01T00:00:00Z",
        dj_profile: { id: "dj1", name: "DJ Shadow", slug: "dj-shadow" },
      },
    ],
    travel: [],
    venue: {
      id: "v1",
      name: "Basement Club",
      location: "Brooklyn, NY",
      address: "123 Underground Ave, Brooklyn, NY 11201",
      capacity: 300,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    venueContact: null,
    promoterName: null,
    ...overrides,
  };
}
