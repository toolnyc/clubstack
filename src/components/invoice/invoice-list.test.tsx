import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InvoiceList } from "./invoice-list";
import type { InvoiceListEntry } from "@/lib/invoice/actions";

vi.mock("@/lib/hooks/use-breakpoint", () => ({
  useBreakpoint: () => "desktop",
}));

function buildInvoiceListEntry(
  overrides: Partial<InvoiceListEntry> = {}
): InvoiceListEntry {
  return {
    id: "inv-1",
    invoiceNumber: "CS-20260315-AB12",
    totalAmount: 2500,
    currency: "usd",
    status: "sent",
    dueDate: "2026-04-01",
    sentAt: "2026-03-15T00:00:00Z",
    paidAt: null,
    createdAt: "2026-03-15T00:00:00Z",
    bookingId: "booking-1",
    venueName: "The Loft",
    eventName: "Friday Night",
    bookingDate: "2026-04-15",
    ...overrides,
  };
}

describe("InvoiceList", () => {
  it("renders invoice number", () => {
    render(<InvoiceList invoices={[buildInvoiceListEntry()]} />);
    expect(screen.getByText("CS-20260315-AB12")).toBeInTheDocument();
  });

  it("renders venue name as booking label", () => {
    render(<InvoiceList invoices={[buildInvoiceListEntry()]} />);
    expect(screen.getByText("The Loft")).toBeInTheDocument();
  });

  it("falls back to event name when venue is null", () => {
    render(
      <InvoiceList
        invoices={[
          buildInvoiceListEntry({ venueName: null, eventName: "Deep Cuts" }),
        ]}
      />
    );
    expect(screen.getByText("Deep Cuts")).toBeInTheDocument();
  });

  it("shows dash when no venue or event name", () => {
    render(
      <InvoiceList
        invoices={[buildInvoiceListEntry({ venueName: null, eventName: null })]}
      />
    );
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });

  it("renders formatted amount", () => {
    render(<InvoiceList invoices={[buildInvoiceListEntry()]} />);
    expect(screen.getByText("$2,500.00")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(
      <InvoiceList invoices={[buildInvoiceListEntry({ status: "paid" })]} />
    );
    expect(screen.getByText("paid")).toBeInTheDocument();
  });

  it("shows empty state when no invoices", () => {
    render(<InvoiceList invoices={[]} />);
    expect(screen.getByText("No invoices yet")).toBeInTheDocument();
  });

  it("renders multiple invoices", () => {
    render(
      <InvoiceList
        invoices={[
          buildInvoiceListEntry({ id: "inv-1", invoiceNumber: "CS-001" }),
          buildInvoiceListEntry({ id: "inv-2", invoiceNumber: "CS-002" }),
        ]}
      />
    );
    expect(screen.getByText("CS-001")).toBeInTheDocument();
    expect(screen.getByText("CS-002")).toBeInTheDocument();
  });

  it("shows dash for missing due date", () => {
    render(
      <InvoiceList invoices={[buildInvoiceListEntry({ dueDate: null })]} />
    );
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });
});
