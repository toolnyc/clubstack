import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
} from "@clubstack/shared";
import { generateInvoiceNumber } from "./invoice-number";

export interface InvoiceListEntry {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  bookingId: string;
  venueName: string | null;
  eventName: string | null;
  bookingDate: string | null;
}

export async function generateInvoiceFromClient(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ error: string | null; invoiceId: string | null }> {
  const { data: artists, error: artistsError } = await supabase
    .from("booking_artists")
    .select("dj_profile_id, fee")
    .eq("booking_id", bookingId);

  if (artistsError) return { error: artistsError.message, invoiceId: null };

  const { data: costs, error: costsError } = await supabase
    .from("booking_costs")
    .select("description, amount, category")
    .eq("booking_id", bookingId);

  if (costsError) return { error: costsError.message, invoiceId: null };

  const djProfileIds = (artists ?? []).map((a) => a.dj_profile_id);
  const { data: djProfiles } = await supabase
    .from("dj_profiles")
    .select("id, name")
    .in("id", djProfileIds.length > 0 ? djProfileIds : ["__none__"]);

  const profileMap = new Map((djProfiles ?? []).map((p) => [p.id, p.name]));

  const lineItems: { description: string; amount: number; category: string }[] =
    [];

  for (const artist of artists ?? []) {
    const name = profileMap.get(artist.dj_profile_id) ?? "Artist";
    lineItems.push({
      description: `Performance fee — ${name}`,
      amount: artist.fee,
      category: "fee",
    });
  }

  for (const cost of costs ?? []) {
    lineItems.push({
      description: cost.description,
      amount: cost.amount,
      category: cost.category ?? "other",
    });
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const invoiceNumber = generateInvoiceNumber();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      status: "draft",
    })
    .select("id")
    .single();

  if (invoiceError) return { error: invoiceError.message, invoiceId: null };

  if (lineItems.length > 0) {
    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(
        lineItems.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          amount: item.amount,
          category: item.category,
        }))
      );

    if (lineItemsError) {
      return { error: lineItemsError.message, invoiceId: invoice.id };
    }
  }

  return { error: null, invoiceId: invoice.id };
}

export async function getInvoiceFromClient(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<{ invoice: Invoice; lineItems: InvoiceLineItem[] } | null> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return null;

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  return {
    invoice: invoice as Invoice,
    lineItems: (lineItems ?? []) as InvoiceLineItem[],
  };
}

export async function getAllInvoicesFromClient(
  supabase: SupabaseClient
): Promise<{ data: InvoiceListEntry[]; error: string | null }> {
  const { data: rows, error } = await supabase
    .from("invoices")
    .select(
      `id, invoice_number, total_amount, currency, status, due_date, sent_at, paid_at, created_at, booking_id, booking:bookings!inner(id, venue:venues(name), booking_dates(date, event_name))`
    )
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  const result: InvoiceListEntry[] = (rows ?? []).map((row) => {
    const booking = row.booking as unknown as {
      id: string;
      venue: { name: string } | null;
      booking_dates: { date: string; event_name: string | null }[];
    };

    const firstDate = booking.booking_dates[0] ?? null;

    return {
      id: row.id as string,
      invoiceNumber: row.invoice_number as string,
      totalAmount: Number(row.total_amount),
      currency: row.currency as string,
      status: row.status as InvoiceStatus,
      dueDate: row.due_date as string | null,
      sentAt: row.sent_at as string | null,
      paidAt: row.paid_at as string | null,
      createdAt: row.created_at as string,
      bookingId: row.booking_id as string,
      venueName: booking.venue?.name ?? null,
      eventName: firstDate?.event_name ?? null,
      bookingDate: firstDate?.date ?? null,
    };
  });

  return { data: result, error: null };
}
