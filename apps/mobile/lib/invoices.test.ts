import { afterEach, describe, expect, it } from "vitest";

import { SEEDED, signInAs, signOut } from "../test/helpers";
import { generateInvoice, getAllInvoices, getInvoice } from "./invoices";
import { supabase } from "./supabase";

afterEach(signOut);

async function deleteTestInvoice(invoiceId: string): Promise<void> {
  await supabase
    .from("invoice_line_items")
    .delete()
    .eq("invoice_id", invoiceId);
  await supabase.from("invoices").delete().eq("id", invoiceId);
}

describe("invoices", () => {
  it("generates, lists and reads an invoice for the booking creator", async () => {
    await signInAs(SEEDED.agencyUser);
    const invoiceId = await generateInvoice(SEEDED.bookingId);

    try {
      const list = await getAllInvoices();
      const entry = list.find((i) => i.id === invoiceId);
      expect(entry).toBeDefined();
      expect(entry?.bookingId).toBe(SEEDED.bookingId);
      // Seeded gig: DJ Testwave fee 1500, no extra costs
      expect(entry?.totalAmount).toBe(1500);

      const detail = await getInvoice(invoiceId);
      expect(detail.invoice.booking_id).toBe(SEEDED.bookingId);
      expect(detail.invoice.invoice_number).toMatch(/^CS-\d{8}-[A-Z0-9]{4}$/);
      expect(detail.lineItems.length).toBe(1);
      expect(detail.lineItems[0].description).toContain("DJ Testwave");
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
