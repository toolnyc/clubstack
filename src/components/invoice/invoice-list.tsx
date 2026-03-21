"use client";

import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { InvoiceListEntry } from "@/lib/invoice/actions";
import type { InvoiceStatus } from "@/types";

interface InvoiceListProps {
  invoices: InvoiceListEntry[];
}

function statusBadgeVariant(
  status: InvoiceStatus
): "default" | "cyan" | "neon" | "error" {
  switch (status) {
    case "paid":
      return "neon";
    case "sent":
      return "cyan";
    case "overdue":
      return "error";
    case "draft":
    case "cancelled":
    default:
      return "default";
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const columns: Column<InvoiceListEntry>[] = [
  {
    key: "invoice_number",
    header: "Invoice #",
    render: (item) => (
      <span className="invoice-list__number">{item.invoiceNumber}</span>
    ),
  },
  {
    key: "booking",
    header: "Booking",
    render: (item) => item.venueName ?? item.eventName ?? "--",
  },
  {
    key: "date",
    header: "Date",
    render: (item) => (item.bookingDate ? formatDate(item.bookingDate) : "--"),
  },
  {
    key: "amount",
    header: "Amount",
    render: (item) => formatCurrency(item.totalAmount, item.currency),
  },
  {
    key: "due_date",
    header: "Due",
    render: (item) => (item.dueDate ? formatDate(item.dueDate) : "--"),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
    ),
  },
];

function InvoiceList({ invoices }: InvoiceListProps) {
  return (
    <div className="invoice-list">
      <DataTable<InvoiceListEntry>
        columns={columns}
        data={invoices}
        keyField="id"
        emptyMessage="No invoices yet"
      />
    </div>
  );
}

export { InvoiceList };
export type { InvoiceListProps };
