import type {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
} from "@clubstack/shared";

import { supabase } from "./supabase";

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

export interface InvoiceDetail {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
}

export async function getAllInvoices(): Promise<InvoiceListEntry[]> {
  const { data: rows, error } = await supabase
    .from("invoices")
    .select(
      `id, invoice_number, total_amount, currency, status, due_date, sent_at, paid_at, created_at, booking_id, booking:bookings!inner(id, venue:venues(name), booking_dates(date, event_name))`
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (rows ?? []).map((row) => {
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
}

export async function getInvoice(invoiceId: string): Promise<InvoiceDetail> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (!invoice) throw new Error("Invoice not found");

  const { data: lineItems, error } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return {
    invoice: invoice as Invoice,
    lineItems: (lineItems ?? []) as InvoiceLineItem[],
  };
}
