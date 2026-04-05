"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { AutoIcon } from "@/components/ui/auto-icon";
import { Badge } from "@/components/ui/badge";
import { updateArtist, removeArtist } from "@/lib/agency/actions";
import type { RosterEntry } from "@/types";

interface ArtistDetailPanelProps {
  entry: RosterEntry;
  onClose: () => void;
}

function ArtistDetailPanel({ entry, onClose }: ArtistDetailPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const dj = entry.dj_profile;
  const rateStr =
    dj.rate_min && dj.rate_max
      ? `$${dj.rate_min}–$${dj.rate_max}`
      : dj.rate_min
        ? `From $${dj.rate_min}`
        : "No rate set";

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("id", entry.id);
    const result = await updateArtist(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
    onClose();
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await removeArtist(entry.id);
    if (result.error) {
      setError(result.error);
      setRemoving(false);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="artist-panel">
      <div className="artist-panel__header">
        <AutoIcon name={dj.name} size={48} />
        <div className="artist-panel__info">
          <h3 className="artist-panel__name">{dj.name}</h3>
          {dj.location && (
            <p className="artist-panel__location">{dj.location}</p>
          )}
          <p className="artist-panel__rate">{rateStr}</p>
          {entry.status === "pending" && (
            <Badge variant="default">Pending approval</Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="artist-panel__form">
        <Input
          label="Commission %"
          name="commission_pct"
          type="number"
          defaultValue={String(entry.commission_pct)}
          min={0}
          max={100}
          step={0.5}
        />
        <Textarea
          label="Private notes"
          name="private_notes"
          defaultValue={entry.private_notes ?? ""}
          placeholder="Internal notes about this artist..."
          rows={4}
          optional
        />

        {error && <p className="artist-panel__error">{error}</p>}

        <div className="artist-panel__actions">
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            loading={removing}
          >
            Remove from roster
          </Button>
          <div className="artist-panel__actions-right">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { ArtistDetailPanel };
export type { ArtistDetailPanelProps };
