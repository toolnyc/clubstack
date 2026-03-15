"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToInvite } from "@/lib/agency/actions";

interface Invite {
  id: string;
  commission_pct: number;
  agency: {
    id: string;
    name: string;
    location: string | null;
  };
}

interface AgencyInvitesProps {
  invites: Invite[];
}

function AgencyInvites({ invites }: AgencyInvitesProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function handleRespond(id: string, accept: boolean) {
    setLoadingId(id);
    await respondToInvite(id, accept);
    router.refresh();
    setLoadingId(null);
  }

  return (
    <div className="agency-invites">
      <h3 className="agency-invites__title">Agency Invites</h3>
      {invites.map((invite) => (
        <div key={invite.id} className="agency-invites__item">
          <div className="agency-invites__info">
            <span className="agency-invites__agency-name">
              {invite.agency.name}
            </span>
            {invite.agency.location && (
              <span className="agency-invites__location">
                {invite.agency.location}
              </span>
            )}
            <span className="agency-invites__commission">
              {invite.commission_pct}% commission
            </span>
          </div>
          <div className="agency-invites__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRespond(invite.id, false)}
              loading={loadingId === invite.id}
            >
              Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRespond(invite.id, true)}
              loading={loadingId === invite.id}
            >
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export { AgencyInvites };
export type { AgencyInvitesProps };
