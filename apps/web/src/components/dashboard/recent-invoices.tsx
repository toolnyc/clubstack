import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentInvoice } from "@/lib/dashboard/actions";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const INVOICE_STATUS_VARIANTS: Record<
  string,
  "default" | "cyan" | "neon" | "error"
> = {
  draft: "default",
  sent: "cyan",
  paid: "neon",
  overdue: "error",
  cancelled: "error",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

interface RecentInvoicesProps {
  invoices: RecentInvoice[];
}

function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <Card className="dashboard__invoices">
      <CardHeader>
        <h2 className="dashboard__section-title">Recent invoices</h2>
        <Link href="/invoices" className="dashboard__view-all">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="dashboard__empty-text">No invoices yet.</p>
        ) : (
          <ul className="dashboard__invoice-list">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="dashboard__invoice-item"
                >
                  <div className="dashboard__invoice-header">
                    <span className="dashboard__invoice-number">
                      {invoice.invoice_number}
                    </span>
                    <Badge
                      variant={
                        INVOICE_STATUS_VARIANTS[invoice.status] ?? "default"
                      }
                    >
                      {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                    </Badge>
                  </div>
                  <div className="dashboard__invoice-meta">
                    <span className="dashboard__invoice-amount">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </span>
                    {invoice.due_date && (
                      <span className="dashboard__invoice-due">
                        Due{" "}
                        {new Date(
                          invoice.due_date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentInvoices };
export type { RecentInvoicesProps };
