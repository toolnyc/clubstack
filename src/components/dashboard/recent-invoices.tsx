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
    <Card className="bg-bg-secondary border border-border-primary rounded-lg p-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-text-primary">
          Recent invoices
        </h2>
        <Link
          href="/invoices"
          className="font-mono text-sm text-accent-cyan hover:text-accent-cyan-hover"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="font-body text-sm text-text-tertiary">
            No invoices yet.
          </p>
        ) : (
          <ul className="flex flex-col">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="block py-3 border-b border-border-secondary hover:bg-bg-tertiary transition-colors duration-150"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-text-primary">
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
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-text-secondary">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </span>
                    {invoice.due_date && (
                      <span className="font-mono text-xs text-text-tertiary">
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
