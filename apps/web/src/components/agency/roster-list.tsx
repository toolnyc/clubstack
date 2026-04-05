"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AutoIcon } from "@/components/ui/auto-icon";
import type { RosterEntry } from "@/types";

interface RosterListProps {
  entries: RosterEntry[];
  onEdit?: (entry: RosterEntry) => void;
  className?: string;
}

function RosterList({ entries, onEdit, className = "" }: RosterListProps) {
  if (entries.length === 0) {
    return (
      <div className={`roster-list roster-list--empty ${className}`}>
        <p className="roster-list__empty-text">
          No artists on your roster yet. Invite DJs to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={`roster-list ${className}`}>
      {entries.map((entry) => {
        const dj = entry.dj_profile;
        const rateStr =
          dj.rate_min && dj.rate_max
            ? `$${dj.rate_min}–$${dj.rate_max}`
            : dj.rate_min
              ? `From $${dj.rate_min}`
              : null;

        return (
          <button
            key={entry.id}
            type="button"
            className="roster-list__item"
            onClick={() => onEdit?.(entry)}
          >
            <AutoIcon name={dj.name} size={40} />
            <div className="roster-list__info">
              <div className="roster-list__name-row">
                <Link
                  href={`/dj/${dj.slug}`}
                  className="roster-list__name"
                  onClick={(e) => e.stopPropagation()}
                >
                  {dj.name}
                </Link>
                {entry.status === "pending" && (
                  <Badge variant="default">Pending</Badge>
                )}
              </div>
              <div className="roster-list__meta">
                {dj.location && (
                  <span className="roster-list__location">
                    <MapPin size={14} strokeWidth={1.5} />
                    {dj.location}
                  </span>
                )}
                {rateStr && (
                  <span className="roster-list__rate">{rateStr}</span>
                )}
                <span className="roster-list__commission">
                  {entry.commission_pct}% commission
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { RosterList };
export type { RosterListProps };
