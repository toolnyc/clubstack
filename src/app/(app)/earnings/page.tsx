import { EarningsDashboard } from "@/components/payments/earnings-dashboard";
import {
  getEarningsSummary,
  getEarningsHistory,
} from "@/lib/payments/earnings-actions";

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
    <main className="earnings-dash__page">
      <h1 className="earnings-dash__page-title">Earnings</h1>
      <EarningsDashboard initialSummary={summary} initialHistory={history} />
    </main>
  );
}
