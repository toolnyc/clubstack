"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type {
  EarningsSummary,
  EarningsEntry,
  EarningsStatus,
  EarningsFilters,
  AnnualSummary,
} from "@/lib/payments/earnings-actions";
import {
  getEarningsHistory,
  getEarningsSummary,
  getAnnualSummary,
} from "@/lib/payments/earnings-actions";

interface EarningsDashboardProps {
  initialSummary: EarningsSummary;
  initialHistory: EarningsEntry[];
}

const STATUS_OPTIONS: { label: string; value: EarningsStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Cancelled", value: "cancelled" },
];

function statusBadgeVariant(
  status: EarningsStatus
): "default" | "cyan" | "neon" | "error" {
  switch (status) {
    case "completed":
      return "neon";
    case "pending":
      return "cyan";
    case "upcoming":
      return "default";
    case "cancelled":
      return "error";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

const columns: Column<EarningsEntry>[] = [
  {
    key: "date",
    header: "Date",
    render: (item) => formatDate(item.date),
  },
  {
    key: "event",
    header: "Venue / Event",
    render: (item) => item.venueName ?? item.eventName ?? "--",
  },
  {
    key: "fee",
    header: "Fee",
    render: (item) => formatCurrency(item.fee),
  },
  {
    key: "commission",
    header: "Commission",
    render: (item) =>
      item.commission > 0
        ? `${formatCurrency(item.commission)} (${item.commissionPct}%)`
        : "--",
  },
  {
    key: "net",
    header: "Net",
    render: (item) => formatCurrency(item.net),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
    ),
  },
];

function EarningsDashboard({
  initialSummary,
  initialHistory,
}: EarningsDashboardProps) {
  const [summary, setSummary] = useState<EarningsSummary>(initialSummary);
  const [history, setHistory] = useState<EarningsEntry[]>(initialHistory);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<EarningsStatus | "">("");
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary | null>(
    null
  );

  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const filters: EarningsFilters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (statusFilter) filters.status = statusFilter;

      const [historyResult, summaryResult] = await Promise.all([
        getEarningsHistory(filters),
        getEarningsSummary(),
      ]);

      if (historyResult.data) setHistory(historyResult.data);
      if (summaryResult.data) setSummary(summaryResult.data);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  const loadAnnualSummary = useCallback(async () => {
    const year = new Date().getFullYear();
    const result = await getAnnualSummary(year);
    if (result.data) setAnnualSummary(result.data);
  }, []);

  return (
    <div className="earnings-dash">
      {/* Summary cards */}
      <div className="earnings-dash__cards">
        <Card className="earnings-dash__card">
          <CardHeader>
            <p className="earnings-dash__card-label">Total earned</p>
          </CardHeader>
          <CardContent>
            <p className="earnings-dash__card-value">
              {formatCurrency(summary.totalEarned)}
            </p>
          </CardContent>
        </Card>

        <Card className="earnings-dash__card">
          <CardHeader>
            <p className="earnings-dash__card-label">Pending</p>
          </CardHeader>
          <CardContent>
            <p className="earnings-dash__card-value">
              {formatCurrency(summary.totalPending)}
            </p>
          </CardContent>
        </Card>

        <Card className="earnings-dash__card">
          <CardHeader>
            <p className="earnings-dash__card-label">Upcoming</p>
          </CardHeader>
          <CardContent>
            <p className="earnings-dash__card-value">
              {formatCurrency(summary.totalUpcoming)}
            </p>
          </CardContent>
        </Card>

        <Card className="earnings-dash__card">
          <CardHeader>
            <p className="earnings-dash__card-label">Total gigs</p>
          </CardHeader>
          <CardContent>
            <p className="earnings-dash__card-value">{summary.gigCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="earnings-dash__filters">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="earnings-dash__filter-input"
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="earnings-dash__filter-input"
        />
        <div className="earnings-dash__filter-select">
          <label
            htmlFor="status-filter"
            className="earnings-dash__filter-label"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as EarningsStatus | "")
            }
            className="earnings-dash__select"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--md earnings-dash__apply-btn"
          onClick={applyFilters}
          disabled={loading}
        >
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {/* Gig history table */}
      <div className="earnings-dash__table">
        <DataTable<EarningsEntry>
          columns={columns}
          data={history}
          keyField="id"
          emptyMessage="No earnings yet"
        />
      </div>

      {/* Annual summary */}
      <div className="earnings-dash__annual">
        {annualSummary ? (
          <Card>
            <CardHeader>
              <h3 className="earnings-dash__annual-title">
                {annualSummary.year} Tax Summary
              </h3>
            </CardHeader>
            <CardContent>
              <div className="earnings-dash__annual-grid">
                <div className="earnings-dash__annual-item">
                  <span className="earnings-dash__annual-label">
                    Gross earned
                  </span>
                  <span className="earnings-dash__annual-value">
                    {formatCurrency(annualSummary.totalEarned)}
                  </span>
                </div>
                <div className="earnings-dash__annual-item">
                  <span className="earnings-dash__annual-label">
                    Commission paid
                  </span>
                  <span className="earnings-dash__annual-value">
                    {formatCurrency(annualSummary.totalCommission)}
                  </span>
                </div>
                <div className="earnings-dash__annual-item">
                  <span className="earnings-dash__annual-label">
                    Net income
                  </span>
                  <span className="earnings-dash__annual-value">
                    {formatCurrency(annualSummary.netIncome)}
                  </span>
                </div>
                <div className="earnings-dash__annual-item">
                  <span className="earnings-dash__annual-label">
                    Gigs played
                  </span>
                  <span className="earnings-dash__annual-value">
                    {annualSummary.gigCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <button
            type="button"
            className="btn btn--secondary btn--md"
            onClick={loadAnnualSummary}
          >
            Load annual tax summary
          </button>
        )}
      </div>
    </div>
  );
}

export { EarningsDashboard };
export type { EarningsDashboardProps };
