"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealSummary } from "./deal-summary";
import { generateId } from "./booking-form";
import type {
  ArtistEntry,
  CostEntry,
  EventDetails,
  DateEntry,
} from "./booking-form";

interface StepCostsReviewProps {
  artists: ArtistEntry[];
  costs: CostEntry[];
  onCostsChange: (costs: CostEntry[]) => void;
  eventDetails: EventDetails;
  dates: DateEntry[];
  error: string | null;
}

const COST_CATEGORIES: { value: CostEntry["category"]; label: string }[] = [
  { value: "travel", label: "Travel" },
  { value: "accommodation", label: "Accommodation" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

function StepCostsReview({
  artists,
  costs,
  onCostsChange,
  eventDetails,
  dates,
  error,
}: StepCostsReviewProps) {
  function addCost() {
    onCostsChange([
      ...costs,
      { id: generateId(), description: "", amount: 0, category: "other" },
    ]);
  }

  function updateCost(id: string, fields: Partial<CostEntry>) {
    onCostsChange(costs.map((c) => (c.id === id ? { ...c, ...fields } : c)));
  }

  function removeCost(id: string) {
    onCostsChange(costs.filter((c) => c.id !== id));
  }

  const activeDates = dates.filter((d) => d.date !== "");

  return (
    <div className="step-costs-review">
      <section className="step-costs-review__section">
        <h3 className="step-costs-review__section-title">Additional costs</h3>

        {costs.map((cost, idx) => (
          <div key={cost.id} className="step-costs-review__cost-row">
            <div className="step-costs-review__cost-fields">
              <Input
                label="Description"
                value={cost.description}
                placeholder="e.g. Flight JFK–LAX"
                onChange={(e) =>
                  updateCost(cost.id, { description: e.target.value })
                }
              />
              <Input
                label="Amount"
                type="number"
                min={0}
                step={10}
                value={cost.amount || ""}
                onChange={(e) =>
                  updateCost(cost.id, { amount: Number(e.target.value) || 0 })
                }
              />
              <div className="step-costs-review__cost-category">
                <label
                  htmlFor={`cost-category-${cost.id}`}
                  className="input-field__label"
                >
                  Category
                </label>
                <select
                  id={`cost-category-${cost.id}`}
                  className="input-field__input"
                  value={cost.category}
                  onChange={(e) =>
                    updateCost(cost.id, {
                      category: e.target.value as CostEntry["category"],
                    })
                  }
                >
                  {COST_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              className="step-costs-review__cost-remove"
              onClick={() => removeCost(cost.id)}
              aria-label={`Remove cost ${idx + 1}`}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}

        <Button type="button" variant="ghost" size="sm" onClick={addCost}>
          <Plus size={14} strokeWidth={1.5} />
          Add cost
        </Button>
      </section>

      <section className="step-costs-review__section">
        <h3 className="step-costs-review__section-title">Booking summary</h3>

        <div className="step-costs-review__summary-details">
          {eventDetails.venue_name && (
            <div className="step-costs-review__detail">
              <span className="step-costs-review__detail-label">Venue</span>
              <span className="step-costs-review__detail-value">
                {eventDetails.venue_name}
              </span>
            </div>
          )}
          {eventDetails.promoter_name && (
            <div className="step-costs-review__detail">
              <span className="step-costs-review__detail-label">Promoter</span>
              <span className="step-costs-review__detail-value">
                {eventDetails.promoter_name}
              </span>
            </div>
          )}
          {eventDetails.event_name && (
            <div className="step-costs-review__detail">
              <span className="step-costs-review__detail-label">Event</span>
              <span className="step-costs-review__detail-value">
                {eventDetails.event_name}
              </span>
            </div>
          )}
          {activeDates.length > 0 && (
            <div className="step-costs-review__detail">
              <span className="step-costs-review__detail-label">Dates</span>
              <span className="step-costs-review__detail-value">
                {activeDates.map((d) => d.date).join(", ")}
              </span>
            </div>
          )}
          <div className="step-costs-review__detail">
            <span className="step-costs-review__detail-label">Payer</span>
            <span className="step-costs-review__detail-value">
              {eventDetails.payer_type === "venue" ? "Venue" : "Promoter"}
            </span>
          </div>
        </div>

        <DealSummary
          artists={artists.map((a) => ({
            fee: a.fee,
            commission_pct: a.commission_pct,
            payment_split_pct: a.payment_split_pct,
          }))}
          costs={costs
            .filter((c) => c.amount > 0)
            .map((c) => ({ amount: c.amount }))}
          viewMode="full"
          artistNames={artists.map((a) => a.name)}
          className="step-costs-review__deal-summary"
        />
      </section>

      {error && (
        <div className="step-costs-review__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export { StepCostsReview };
export type { StepCostsReviewProps };
