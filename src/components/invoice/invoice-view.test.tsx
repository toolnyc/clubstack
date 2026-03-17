import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InvoiceView } from "./invoice-view";
import { buildInvoice, buildLineItem } from "@/test/factories";

describe("InvoiceView", () => {
  it("renders invoice number", () => {
    render(<InvoiceView invoice={buildInvoice()} lineItems={[]} mode="full" />);
    expect(screen.getByText("CS-20260315-AB12")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(
      <InvoiceView
        invoice={buildInvoice({ status: "sent" })}
        lineItems={[]}
        mode="full"
      />
    );
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("renders total amount", () => {
    render(
      <InvoiceView
        invoice={buildInvoice({ total_amount: 2500 })}
        lineItems={[]}
        mode="payer"
      />
    );
    expect(screen.getByText("$2,500.00")).toBeInTheDocument();
  });

  it("renders line items in full mode", () => {
    const items = [
      buildLineItem({
        id: "li-1",
        description: "Performance fee — DJ Shadow",
        amount: 2000,
      }),
      buildLineItem({
        id: "li-2",
        description: "Flight LAX-JFK",
        amount: 500,
        category: "travel",
      }),
    ];

    render(
      <InvoiceView invoice={buildInvoice()} lineItems={items} mode="full" />
    );

    expect(screen.getByText("Performance fee — DJ Shadow")).toBeInTheDocument();
    expect(screen.getByText("Flight LAX-JFK")).toBeInTheDocument();
    expect(screen.getByText("travel")).toBeInTheDocument();
  });

  it("hides line items in payer mode", () => {
    const items = [
      buildLineItem({ description: "Performance fee — DJ Shadow" }),
    ];

    render(
      <InvoiceView invoice={buildInvoice()} lineItems={items} mode="payer" />
    );

    expect(
      screen.queryByText("Performance fee — DJ Shadow")
    ).not.toBeInTheDocument();
  });

  it("shows total in payer mode", () => {
    render(
      <InvoiceView
        invoice={buildInvoice({ total_amount: 3000 })}
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
        invoice={buildInvoice({ due_date: "2026-04-01" })}
        lineItems={[]}
        mode="full"
      />
    );
    expect(screen.getByText("Due")).toBeInTheDocument();
  });

  it("shows paid notice when paid_at is set", () => {
    render(
      <InvoiceView
        invoice={buildInvoice({
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
    render(<InvoiceView invoice={buildInvoice()} lineItems={[]} mode="full" />);
    expect(screen.queryByText(/Paid on/)).not.toBeInTheDocument();
  });

  it("renders brand name", () => {
    render(<InvoiceView invoice={buildInvoice()} lineItems={[]} mode="full" />);
    expect(screen.getByText("ClubStack")).toBeInTheDocument();
  });
});
