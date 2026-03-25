import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getDashboardData } from "@/lib/dashboard/actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingBookings } from "@/components/dashboard/upcoming-bookings";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { ActionItems } from "@/components/dashboard/action-items";
import { CalendarStatus } from "@/components/dashboard/calendar-status";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const isAgency = data.userType === "agency";
  const greeting = data.displayName
    ? `Welcome back, ${data.displayName}`
    : "Welcome back";

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex flex-col gap-6 p-6">
        <p className="font-[var(--font-display)] text-xl font-semibold text-text-primary">
          {greeting}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: upcoming bookings */}
          <div className="lg:col-span-2">
            <UpcomingBookings bookings={data.upcomingBookings} />
          </div>

          {/* Right column: stats + calendar */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard
                label="Active bookings"
                value={data.stats.activeBookings}
              />
              {isAgency && (
                <StatCard label="Roster size" value={data.stats.rosterSize} />
              )}
              <StatCard
                label="Revenue this month"
                value={formatCurrency(data.stats.revenueThisMonth)}
              />
            </div>
            <CalendarStatus
              connected={data.calendarConnected}
              calendarId={data.calendarId}
            />
          </div>
        </div>

        {/* Bottom row: action items + recent invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActionItems items={data.actionItems} />
          <RecentInvoices invoices={data.recentInvoices} />
        </div>
      </main>
    </>
  );
}
