import Link from "next/link";
import type { Invoice, InvoiceLineItem } from "@clubstack/shared";
import { InvoiceActions } from "./invoice-actions";

interface InvoiceDetailProps {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InvoiceDetail({ invoice, lineItems }: InvoiceDetailProps) {
  return (
    <div className="invoice-view">
      <div className="invoice-view__header">
        <div className="invoice-view__brand">Clubstack</div>
        <div className="invoice-view__meta">
          <span className="invoice-view__number">{invoice.invoice_number}</span>
          <span
            className={`invoice-view__status invoice-view__status--${invoice.status}`}
          >
            {invoice.status}
          </span>
        </div>
      </div>

      <div className="invoice-view__dates">
        <div className="invoice-view__date-row">
          <span className="invoice-view__date-label">Booking</span>
          <Link
            href={`/bookings/${invoice.booking_id}`}
            className="invoice-view__date-value invoice-view__booking-link"
          >
            View booking &rarr;
          </Link>
        </div>
        <div className="invoice-view__date-row">
          <span className="invoice-view__date-label">Created</span>
          <span className="invoice-view__date-value">
            {formatDate(invoice.created_at)}
          </span>
        </div>
        <div className="invoice-view__date-row">
          <span className="invoice-view__date-label">Due</span>
          <span className="invoice-view__date-value">
            {formatDate(invoice.due_date)}
          </span>
        </div>
        <div className="invoice-view__date-row">
          <span className="invoice-view__date-label">Sent</span>
          <span className="invoice-view__date-value">
            {formatDate(invoice.sent_at)}
          </span>
        </div>
        <div className="invoice-view__date-row">
          <span className="invoice-view__date-label">Paid</span>
          <span className="invoice-view__date-value">
            {formatDate(invoice.paid_at)}
          </span>
        </div>
      </div>

      <div className="invoice-view__line-items">
        <div className="invoice-view__line-header">
          <span className="invoice-view__line-header-desc">Description</span>
          <span className="invoice-view__line-header-amount">Amount</span>
        </div>
        {lineItems.map((item) => (
          <div key={item.id} className="invoice-view__line-row">
            <div className="invoice-view__line-desc">
              <span className="invoice-view__line-text">
                {item.description}
              </span>
              {item.category && (
                <span className="invoice-view__line-category">
                  {item.category}
                </span>
              )}
            </div>
            <span className="invoice-view__line-amount">
              {formatCurrency(item.amount, invoice.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="invoice-view__total">
        <span className="invoice-view__total-label">Total</span>
        <span className="invoice-view__total-value">
          {formatCurrency(invoice.total_amount, invoice.currency)}
        </span>
      </div>

      {invoice.status === "paid" && (
        <div className="invoice-view__paid-notice">
          Paid on {formatDate(invoice.paid_at)}
        </div>
      )}

      <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
    </div>
  );
}

export { InvoiceDetail };
export type { InvoiceDetailProps };
