import { afterEach, describe, expect, it } from "vitest";

import { SEEDED, signInAs, signOut } from "../test/helpers";
import { getAllInvoices, getInvoice } from "./invoices";
import { supabase } from "./supabase";

afterEach(signOut);

async function insertTestInvoice(): Promise<string> {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      booking_id: SEEDED.bookingId,
      invoice_number: `TEST-${Date.now()}`,
      total_amount: 1500,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: lineError } = await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    description: "Performance fee — DJ Testwave",
    amount: 1500,
    category: "fee",
  });
  if (lineError) throw new Error(lineError.message);

  return invoice.id as string;
}

async function deleteTestInvoice(invoiceId: string): Promise<void> {
  await supabase
    .from("invoice_line_items")
    .delete()
    .eq("invoice_id", invoiceId);
  await supabase.from("invoices").delete().eq("id", invoiceId);
}

describe("invoices", () => {
  it("lists and reads an invoice for the booking creator", async () => {
    await signInAs(SEEDED.agencyUser);
    const invoiceId = await insertTestInvoice();

    try {
      const list = await getAllInvoices();
      const entry = list.find((i) => i.id === invoiceId);
      expect(entry).toBeDefined();
      expect(entry?.bookingId).toBe(SEEDED.bookingId);
      expect(entry?.totalAmount).toBe(1500);

      const detail = await getInvoice(invoiceId);
      expect(detail.invoice.booking_id).toBe(SEEDED.bookingId);
      expect(detail.lineItems.length).toBe(1);
    } finally {
      await deleteTestInvoice(invoiceId);
    }
  });

  it("hides invoices from users without booking access", async () => {
    await signInAs(SEEDED.venueUser);

    expect(await getAllInvoices()).toEqual([]);
  });

  it("throws for an invoice hidden by RLS", async () => {
    await expect(getInvoice(SEEDED.bookingId)).rejects.toThrow(
      "Invoice not found"
    );
  });
});
