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
      <main className="dashboard">
        <p className="dashboard__greeting">{greeting}</p>

        <div className="dashboard__grid">
          {/* Left column: upcoming bookings */}
          <div className="dashboard__col-left">
            <UpcomingBookings bookings={data.upcomingBookings} />
          </div>

          {/* Right column: stats + calendar */}
          <div className="dashboard__col-right">
            <div className="dashboard__stats">
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
        <div className="dashboard__bottom">
          <ActionItems items={data.actionItems} />
          <RecentInvoices invoices={data.recentInvoices} />
        </div>
      </main>
    </>
  );
}
