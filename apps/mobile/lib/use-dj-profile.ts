import { useCallback, useEffect, useState } from "react";
import type { DJProfile } from "@clubstack/shared";

import { useAuth } from "./auth-context";
import { getDJProfile, saveDJProfile, type DJProfileInput } from "./dj-profile";

export function useDJProfile() {
  const { user } = useAuth();
  const [djProfile, setDjProfile] = useState<DJProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setDjProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const profile = await getDJProfile(user.id);
      setDjProfile(profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: DJProfileInput) => {
      if (!user) throw new Error("Not authenticated");

      const updated = await saveDJProfile(user.id, input);
      setDjProfile(updated);
      return updated;
    },
    [user]
  );

  return { djProfile, isLoading, error, save, refresh };
}
