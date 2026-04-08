"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { generateId } from "./booking-form";
import type { ArtistEntry } from "./booking-form";
import type { RosterEntry } from "@clubstack/shared";

interface StepArtistsProps {
  roster: RosterEntry[];
  value: ArtistEntry[];
  onChange: (value: ArtistEntry[]) => void;
}

function StepArtists({ roster, value, onChange }: StepArtistsProps) {
  const activeRoster = roster.filter((r) => r.status === "active");
  const selectedIds = new Set(value.map((a) => a.dj_profile_id));

  function addArtist(djProfileId: string) {
    const entry = activeRoster.find((r) => r.dj_profile_id === djProfileId);
    if (!entry) return;

    const newArtistCount = value.length + 1;
    const defaultSplit = newArtistCount > 1 ? 50 : 100;

    const updated = value.map((a) => ({
      ...a,
      payment_split_pct: defaultSplit,
    }));

    updated.push({
      id: generateId(),
      dj_profile_id: entry.dj_profile_id,
      name: entry.dj_profile.name,
      fee: entry.dj_profile.rate_min ?? 0,
      commission_pct: entry.commission_pct,
      payment_split_pct: defaultSplit,
    });

    onChange(updated);
  }

  function updateArtist(id: string, fields: Partial<ArtistEntry>) {
    onChange(value.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  }

  function removeArtist(id: string) {
    const remaining = value.filter((a) => a.id !== id);
    if (remaining.length === 1) {
      remaining[0] = { ...remaining[0], payment_split_pct: 100 };
    }
    onChange(remaining);
  }

  const totalFees = value.reduce((sum, a) => sum + a.fee, 0);

  if (activeRoster.length === 0) {
    return (
      <div className="step-artists">
        <div className="step-artists__empty">
          <p className="step-artists__empty-text">
            No artists on your roster yet. Add artists to your roster before
            creating a booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="step-artists">
      {value.map((artist) => (
        <div key={artist.id} className="step-artists__card">
          <div className="step-artists__card-header">
            <span className="step-artists__card-name">{artist.name}</span>
            <button
              type="button"
              className="step-artists__remove"
              onClick={() => removeArtist(artist.id)}
              aria-label={`Remove ${artist.name}`}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div className="step-artists__card-fields">
            <Input
              label="Fee"
              type="number"
              min={0}
              step={50}
              value={artist.fee || ""}
              onChange={(e) =>
                updateArtist(artist.id, { fee: Number(e.target.value) || 0 })
              }
            />
            <Input
              label="Commission %"
              type="number"
              min={0}
              max={100}
              value={artist.commission_pct}
              onChange={(e) =>
                updateArtist(artist.id, {
                  commission_pct: Number(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Split %"
              type="number"
              min={0}
              max={100}
              value={artist.payment_split_pct}
              onChange={(e) =>
                updateArtist(artist.id, {
                  payment_split_pct: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
      ))}

      {activeRoster.filter((r) => !selectedIds.has(r.dj_profile_id)).length >
        0 && (
        <div className="step-artists__add">
          <label htmlFor="add-artist-select" className="input-field__label">
            Add artist
          </label>
          <select
            id="add-artist-select"
            className="input-field__input"
            value=""
            onChange={(e) => {
              if (e.target.value) addArtist(e.target.value);
            }}
          >
            <option value="">Select from roster...</option>
            {activeRoster
              .filter((r) => !selectedIds.has(r.dj_profile_id))
              .map((r) => (
                <option key={r.dj_profile_id} value={r.dj_profile_id}>
                  {r.dj_profile.name}
                  {r.dj_profile.rate_min ? ` — $${r.dj_profile.rate_min}` : ""}
                </option>
              ))}
          </select>
        </div>
      )}

      {value.length > 0 && (
        <div className="step-artists__total">
          <span className="step-artists__total-label">Total fees</span>
          <span className="step-artists__total-value">
            ${totalFees.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

export { StepArtists };
export type { StepArtistsProps };
