import { calculateDealSummary } from "@/lib/booking/deal-math";
import type { BookingArtist, BookingCost } from "@/types";

interface DealSummaryProps {
  artists: Pick<
    BookingArtist,
    "fee" | "commission_pct" | "payment_split_pct"
  >[];
  costs: Pick<BookingCost, "amount">[];
  viewMode: "full" | "payer";
  artistNames?: string[];
  className?: string;
}

function DealSummary({
  artists,
  costs,
  viewMode,
  artistNames = [],
  className = "",
}: DealSummaryProps) {
  const summary = calculateDealSummary(artists, costs);

  if (viewMode === "payer") {
    return (
      <div className={`deal-summary ${className}`}>
        <div className="deal-summary__row deal-summary__row--total">
          <span className="deal-summary__label">Total due</span>
          <span className="deal-summary__value">
            $
            {summary.totalOwed.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`deal-summary ${className}`}>
      {summary.artists.map((a, i) => (
        <div key={i} className="deal-summary__artist-block">
          <div className="deal-summary__artist-name">
            {artistNames[i] ?? `Artist ${i + 1}`}
          </div>
          <div className="deal-summary__row">
            <span className="deal-summary__label">Fee</span>
            <span className="deal-summary__value">
              $
              {a.splitFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="deal-summary__row">
            <span className="deal-summary__label">Commission</span>
            <span className="deal-summary__value deal-summary__value--deduct">
              −$
              {a.commission.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="deal-summary__row deal-summary__row--subtotal">
            <span className="deal-summary__label">Net to artist</span>
            <span className="deal-summary__value">
              $
              {a.netToArtist.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      ))}

      <div className="deal-summary__divider" />

      <div className="deal-summary__row">
        <span className="deal-summary__label">Gross fees</span>
        <span className="deal-summary__value">
          $
          {summary.grossFees.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>

      {summary.totalCosts > 0 && (
        <div className="deal-summary__row">
          <span className="deal-summary__label">Costs</span>
          <span className="deal-summary__value">
            $
            {summary.totalCosts.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      <div className="deal-summary__row">
        <span className="deal-summary__label">Total commission</span>
        <span className="deal-summary__value">
          $
          {summary.totalCommission.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>

      <div className="deal-summary__row deal-summary__row--total">
        <span className="deal-summary__label">Total owed by payer</span>
        <span className="deal-summary__value">
          $
          {summary.totalOwed.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}

export { DealSummary };
export type { DealSummaryProps };
