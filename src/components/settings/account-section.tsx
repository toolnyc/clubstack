"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

interface AccountSectionProps {
  email: string | null;
  displayName: string | null;
}

function AccountSection({ email, displayName }: AccountSectionProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <div className="account-section">
      <h2 className="account-section__title">Account</h2>
      <div className="account-section__fields">
        {displayName && (
          <div className="account-section__field">
            <span className="account-section__label">Name</span>
            <span className="account-section__value">{displayName}</span>
          </div>
        )}
        <div className="account-section__field">
          <span className="account-section__label">Email</span>
          <span className="account-section__value">{email ?? "—"}</span>
        </div>
      </div>
      <div className="account-section__actions">
        <Button
          variant="destructive"
          size="sm"
          loading={isPending}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

export { AccountSection };
export type { AccountSectionProps };
