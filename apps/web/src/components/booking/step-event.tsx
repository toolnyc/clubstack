"use client";

import { Input, Textarea } from "@/components/ui/input";
import type { Venue, Promoter } from "@/types";
import type { EventDetails } from "./booking-form";

interface StepEventProps {
  venues: Venue[];
  promoters: Promoter[];
  value: EventDetails;
  onChange: (value: EventDetails) => void;
}

function StepEvent({ venues, promoters, value, onChange }: StepEventProps) {
  function update(fields: Partial<EventDetails>) {
    onChange({ ...value, ...fields });
  }

  return (
    <div className="step-event">
      <div className="step-event__field">
        <label htmlFor="venue-select" className="input-field__label">
          Venue
        </label>
        <select
          id="venue-select"
          className="input-field__input"
          value={value.venue_id}
          onChange={(e) => {
            const venue = venues.find((v) => v.id === e.target.value);
            update({
              venue_id: e.target.value,
              venue_name: venue?.name ?? "",
            });
          }}
        >
          <option value="">Select a venue...</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
              {v.location ? ` — ${v.location}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="step-event__field">
        <label htmlFor="promoter-select" className="input-field__label">
          Promoter
        </label>
        <select
          id="promoter-select"
          className="input-field__input"
          value={value.promoter_id}
          onChange={(e) => {
            const promoter = promoters.find((p) => p.id === e.target.value);
            update({
              promoter_id: e.target.value,
              promoter_name: promoter?.name ?? "",
            });
          }}
        >
          <option value="">Select a promoter...</option>
          {promoters.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.location ? ` — ${p.location}` : ""}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Event name"
        optional
        placeholder="e.g. Friday Residency"
        value={value.event_name}
        onChange={(e) => update({ event_name: e.target.value })}
      />

      <div className="step-event__field">
        <label className="input-field__label">Payer</label>
        <div className="step-event__payer-options">
          <button
            type="button"
            className={`step-event__payer-btn ${value.payer_type === "venue" ? "step-event__payer-btn--active" : ""}`}
            onClick={() => update({ payer_type: "venue" })}
          >
            Venue
          </button>
          <button
            type="button"
            className={`step-event__payer-btn ${value.payer_type === "promoter" ? "step-event__payer-btn--active" : ""}`}
            onClick={() => update({ payer_type: "promoter" })}
          >
            Promoter
          </button>
        </div>
      </div>

      <Textarea
        label="Notes"
        optional
        placeholder="Internal notes about this booking..."
        rows={3}
        value={value.notes}
        onChange={(e) => update({ notes: e.target.value })}
      />
    </div>
  );
}

export { StepEvent };
export type { StepEventProps };
