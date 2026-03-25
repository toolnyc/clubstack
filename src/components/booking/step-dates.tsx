"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateId } from "./booking-form";
import type { DateEntry } from "./booking-form";

interface StepDatesProps {
  value: DateEntry[];
  onChange: (value: DateEntry[]) => void;
}

function StepDates({ value, onChange }: StepDatesProps) {
  function updateDate(id: string, fields: Partial<DateEntry>) {
    onChange(value.map((d) => (d.id === id ? { ...d, ...fields } : d)));
  }

  function addDate() {
    onChange([
      ...value,
      {
        id: generateId(),
        date: "",
        set_time: "",
        load_in_time: "",
        event_name: "",
      },
    ]);
  }

  function removeDate(id: string) {
    if (value.length <= 1) return;
    onChange(value.filter((d) => d.id !== id));
  }

  return (
    <div className="step-dates">
      {value.map((entry, idx) => (
        <div key={entry.id} className="step-dates__row">
          <div className="step-dates__row-header">
            <span className="step-dates__row-label">Date {idx + 1}</span>
            {value.length > 1 && (
              <button
                type="button"
                className="step-dates__remove"
                onClick={() => removeDate(entry.id)}
                aria-label={`Remove date ${idx + 1}`}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
          <div className="step-dates__fields">
            <Input
              label="Date"
              type="date"
              value={entry.date}
              onChange={(e) => updateDate(entry.id, { date: e.target.value })}
            />
            <Input
              label="Set time"
              type="time"
              optional
              value={entry.set_time}
              onChange={(e) =>
                updateDate(entry.id, { set_time: e.target.value })
              }
            />
            <Input
              label="Load-in time"
              type="time"
              optional
              value={entry.load_in_time}
              onChange={(e) =>
                updateDate(entry.id, { load_in_time: e.target.value })
              }
            />
            <Input
              label="Event name"
              optional
              placeholder="Override per date"
              value={entry.event_name}
              onChange={(e) =>
                updateDate(entry.id, { event_name: e.target.value })
              }
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={addDate}>
        <Plus size={14} strokeWidth={1.5} />
        Add another date
      </Button>
    </div>
  );
}

export { StepDates };
export type { StepDatesProps };
