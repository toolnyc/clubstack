"use client";

import { useState } from "react";
import { UserPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RosterList } from "@/components/agency/roster-list";
import { InviteArtistForm } from "@/components/agency/invite-artist-form";
import { ArtistDetailPanel } from "@/components/agency/artist-detail-panel";
import { CSVImport } from "@/components/agency/csv-import";
import type { Agency, RosterEntry } from "@/types";

type View = "list" | "invite" | "csv" | "detail";

interface RosterPageClientProps {
  agency: Agency;
  roster: RosterEntry[];
}

function RosterPageClient({ agency, roster }: RosterPageClientProps) {
  const [view, setView] = useState<View>("list");
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);

  function handleEdit(entry: RosterEntry) {
    setSelectedEntry(entry);
    setView("detail");
  }

  function handleClose() {
    setView("list");
    setSelectedEntry(null);
  }

  return (
    <div className="roster-page">
      <div className="roster-page__header">
        <div>
          <h1 className="roster-page__title">{agency.name}</h1>
          <p className="roster-page__count">
            {roster.length} artist{roster.length !== 1 ? "s" : ""}
          </p>
        </div>
        {view === "list" && (
          <div className="roster-page__actions">
            <Button variant="ghost" size="sm" onClick={() => setView("csv")}>
              <Upload size={16} strokeWidth={1.5} />
              Import CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setView("invite")}
            >
              <UserPlus size={16} strokeWidth={1.5} />
              Invite DJ
            </Button>
          </div>
        )}
      </div>

      {view === "list" && <RosterList entries={roster} onEdit={handleEdit} />}

      {view === "invite" && <InviteArtistForm onClose={handleClose} />}

      {view === "csv" && <CSVImport onClose={handleClose} />}

      {view === "detail" && selectedEntry && (
        <ArtistDetailPanel entry={selectedEntry} onClose={handleClose} />
      )}
    </div>
  );
}

export { RosterPageClient };
