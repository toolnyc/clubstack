"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types";
import type { BookingStatusOrCancelled } from "@/lib/booking/status-machine";
import type { Column } from "@/components/ui/data-table";
import type { BadgeVariant } from "@/components/ui/badge";

const STATUS_LABELS: Record<BookingStatusOrCancelled, string> = {
  draft: "Draft",
  contract_sent: "Contract Sent",
  signed: "Signed",
  deposit_paid: "Deposit Paid",
  balance_paid: "Balance Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_BADGE_VARIANT: Record<BookingStatusOrCancelled, BadgeVariant> = {
  draft: "default",
  contract_sent: "cyan",
  signed: "cyan",
  deposit_paid: "neon",
  balance_paid: "neon",
  completed: "neon",
  cancelled: "error",
};

const ALL_FILTER_OPTIONS: BookingStatusOrCancelled[] = [
  "draft",
  "contract_sent",
  "signed",
  "deposit_paid",
  "balance_paid",
  "completed",
  "cancelled",
];

interface BookingDashboardProps {
  bookings: Booking[];
  onRowClick?: (booking: Booking) => void;
  className?: string;
}

function BookingDashboard({
  bookings,
  onRowClick,
  className = "",
}: BookingDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<
    BookingStatusOrCancelled | "all"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let result = bookings;

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (dateFrom) {
      result = result.filter((b) => b.created_at >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((b) => b.created_at <= dateTo);
    }

    return result;
  }, [bookings, statusFilter, dateFrom, dateTo]);

  const columns: Column<Booking>[] = [
    {
      key: "status",
      header: "Status",
      render: (booking) => (
        <Badge variant={STATUS_BADGE_VARIANT[booking.status]}>
          {STATUS_LABELS[booking.status]}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (booking) => booking.created_at.split("T")[0],
    },
    {
      key: "notes",
      header: "Notes",
      render: (booking) => booking.notes ?? "—",
    },
  ];

  return (
    <div className={`booking-dash ${className}`}>
      <div className="booking-dash__filters">
        <div className="booking-dash__filter-group">
          <label htmlFor="status-filter" className="booking-dash__label">
            Status
          </label>
          <select
            id="status-filter"
            className="booking-dash__select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as BookingStatusOrCancelled | "all"
              )
            }
          >
            <option value="all">All statuses</option>
            {ALL_FILTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="booking-dash__filter-group">
          <label htmlFor="date-from" className="booking-dash__label">
            From
          </label>
          <input
            id="date-from"
            type="date"
            className="booking-dash__input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="booking-dash__filter-group">
          <label htmlFor="date-to" className="booking-dash__label">
            To
          </label>
          <input
            id="date-to"
            type="date"
            className="booking-dash__input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyField="id"
        onRowClick={onRowClick}
        emptyMessage="No bookings found"
        className="booking-dash__table"
      />
    </div>
  );
}

export { BookingDashboard };
export type { BookingDashboardProps };
