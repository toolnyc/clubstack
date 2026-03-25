import { EarningsDashboard } from "@/components/payments/earnings-dashboard";
import {
  getEarningsSummary,
  getEarningsHistory,
} from "@/lib/payments/earnings-actions";
import { TopBar } from "@/components/layout/top-bar";

export default async function EarningsPage() {
  const [summaryResult, historyResult] = await Promise.all([
    getEarningsSummary(),
    getEarningsHistory(),
  ]);

  const summary = summaryResult.data ?? {
    totalEarned: 0,
    totalPending: 0,
    totalUpcoming: 0,
    gigCount: 0,
  };

  const history = historyResult.data ?? [];

  return (
    <>
      <TopBar title="Earnings" />
      <main className="earnings-dash__page">
        <EarningsDashboard initialSummary={summary} initialHistory={history} />
      </main>
    </>
  );
}
