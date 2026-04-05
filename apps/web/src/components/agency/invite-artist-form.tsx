"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteArtist } from "@/lib/agency/actions";

interface InviteArtistFormProps {
  onClose?: () => void;
  className?: string;
}

function InviteArtistForm({ onClose, className = "" }: InviteArtistFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await inviteArtist(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
    onClose?.();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className={`invite-form ${className}`}>
      <Input
        label="DJ email"
        name="email"
        type="email"
        placeholder="dj@example.com"
        required
        error={error}
      />
      <Input
        label="Commission %"
        name="commission_pct"
        type="number"
        defaultValue="15"
        min={0}
        max={100}
        step={0.5}
      />
      <div className="invite-form__actions">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          Send invite
        </Button>
      </div>
    </form>
  );
}

export { InviteArtistForm };
export type { InviteArtistFormProps };
