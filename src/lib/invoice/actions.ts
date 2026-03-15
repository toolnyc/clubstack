"use server";

import { createClient } from "@/lib/supabase/server";
import { generateInvoiceNumber } from "./invoice-number";
import type { Invoice, InvoiceLineItem, InvoiceStatus } from "@/types";

export async function generateInvoice(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", invoiceId: null };

  // Fetch booking artists (fees)
  const { data: artists, error: artistsError } = await supabase
    .from("booking_artists")
    .select("dj_profile_id, fee")
    .eq("booking_id", bookingId);

  if (artistsError) return { error: artistsError.message, invoiceId: null };

  // Fetch booking costs (travel, accommodation, etc.)
  const { data: costs, error: costsError } = await supabase
    .from("booking_costs")
    .select("description, amount, category")
    .eq("booking_id", bookingId);

  if (costsError) return { error: costsError.message, invoiceId: null };

  // Fetch DJ profile names for line item descriptions
  const djProfileIds = (artists ?? []).map((a) => a.dj_profile_id);
  const { data: djProfiles } = await supabase
    .from("dj_profiles")
    .select("id, name")
    .in("id", djProfileIds.length > 0 ? djProfileIds : ["__none__"]);

  const profileMap = new Map((djProfiles ?? []).map((p) => [p.id, p.name]));

  // Build line items
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

  // Create invoice
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

  // Create line items
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

export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();

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

export async function getInvoices(bookingId: string) {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  return (invoices ?? []) as Invoice[];
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = { status };

  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  } else if (status === "paid") {
    updates.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId);

  if (error) return { error: error.message };
  return { error: null };
}
