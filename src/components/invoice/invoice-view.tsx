import type { Invoice, InvoiceLineItem } from "@/types";

interface InvoiceViewProps {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
  mode: "full" | "payer";
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function InvoiceView({ invoice, lineItems, mode }: InvoiceViewProps) {
  return (
    <div className="invoice-view">
      <div className="invoice-view__header">
        <div className="invoice-view__brand">Clubstack</div>
        <div className="invoice-view__meta">
          <span className="invoice-view__number">{invoice.invoice_number}</span>
          <span
            className={`invoice-view__status invoice-view__status--${invoice.status}`}
          >
            {statusLabel(invoice.status)}
          </span>
        </div>
      </div>

      <div className="invoice-view__dates">
        <div className="invoice-view__date-row">
          <span className="invoice-view__date-label">Issued</span>
          <span className="invoice-view__date-value">
            {formatDate(invoice.created_at)}
          </span>
        </div>
        {invoice.due_date && (
          <div className="invoice-view__date-row">
            <span className="invoice-view__date-label">Due</span>
            <span className="invoice-view__date-value">
              {formatDate(invoice.due_date)}
            </span>
          </div>
        )}
      </div>

      {mode === "full" && lineItems.length > 0 && (
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
      )}

      <div className="invoice-view__total">
        <span className="invoice-view__total-label">Total</span>
        <span className="invoice-view__total-value">
          {formatCurrency(invoice.total_amount, invoice.currency)}
        </span>
      </div>

      {invoice.paid_at && (
        <div className="invoice-view__paid-notice">
          Paid on {formatDate(invoice.paid_at)}
        </div>
      )}
    </div>
  );
}
