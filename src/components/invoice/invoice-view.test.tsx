import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InvoiceView } from "./invoice-view";
import type { Invoice, InvoiceLineItem } from "@/types";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
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

function makeLineItem(
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

describe("InvoiceView", () => {
  it("renders invoice number", () => {
    render(<InvoiceView invoice={makeInvoice()} lineItems={[]} mode="full" />);
    expect(screen.getByText("CS-20260315-AB12")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(
      <InvoiceView
        invoice={makeInvoice({ status: "sent" })}
        lineItems={[]}
        mode="full"
      />
    );
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("renders total amount", () => {
    render(
      <InvoiceView
        invoice={makeInvoice({ total_amount: 2500 })}
        lineItems={[]}
        mode="payer"
      />
    );
    expect(screen.getByText("$2,500.00")).toBeInTheDocument();
  });

  it("renders line items in full mode", () => {
    const items = [
      makeLineItem({
        id: "li-1",
        description: "Performance fee — DJ Shadow",
        amount: 2000,
      }),
      makeLineItem({
        id: "li-2",
        description: "Flight LAX-JFK",
        amount: 500,
        category: "travel",
      }),
    ];

    render(
      <InvoiceView invoice={makeInvoice()} lineItems={items} mode="full" />
    );

    expect(screen.getByText("Performance fee — DJ Shadow")).toBeInTheDocument();
    expect(screen.getByText("Flight LAX-JFK")).toBeInTheDocument();
    expect(screen.getByText("travel")).toBeInTheDocument();
  });

  it("hides line items in payer mode", () => {
    const items = [
      makeLineItem({ description: "Performance fee — DJ Shadow" }),
    ];

    render(
      <InvoiceView invoice={makeInvoice()} lineItems={items} mode="payer" />
    );

    expect(
      screen.queryByText("Performance fee — DJ Shadow")
    ).not.toBeInTheDocument();
  });

  it("shows total in payer mode", () => {
    render(
      <InvoiceView
        invoice={makeInvoice({ total_amount: 3000 })}
        lineItems={[]}
        mode="payer"
      />
    );
    expect(screen.getByText("$3,000.00")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("shows due date when present", () => {
    render(
      <InvoiceView
        invoice={makeInvoice({ due_date: "2026-04-01" })}
        lineItems={[]}
        mode="full"
      />
    );
    expect(screen.getByText("Due")).toBeInTheDocument();
  });

  it("shows paid notice when paid_at is set", () => {
    render(
      <InvoiceView
        invoice={makeInvoice({
          status: "paid",
          paid_at: "2026-03-20T12:00:00Z",
        })}
        lineItems={[]}
        mode="full"
      />
    );
    expect(screen.getByText(/Paid on/)).toBeInTheDocument();
  });

  it("does not show paid notice when not paid", () => {
    render(<InvoiceView invoice={makeInvoice()} lineItems={[]} mode="full" />);
    expect(screen.queryByText(/Paid on/)).not.toBeInTheDocument();
  });

  it("renders brand name", () => {
    render(<InvoiceView invoice={makeInvoice()} lineItems={[]} mode="full" />);
    expect(screen.getByText("ClubStack")).toBeInTheDocument();
  });
});
