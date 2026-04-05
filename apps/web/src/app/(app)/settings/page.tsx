import { TopBar } from "@/components/layout/top-bar";
import { NotificationSettings } from "@/components/notifications/notification-settings";
import { AccountSection } from "@/components/settings/account-section";
import { getPreferences } from "@/lib/notifications/preferences-actions";
import { getProfile } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const [{ preferences }, profile, supabase] = await Promise.all([
    getPreferences(),
    getProfile(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <TopBar title="Settings" />
      <div className="settings-page">
        <section className="settings-page__section">
          <NotificationSettings initialPreferences={preferences} />
        </section>
        <section className="settings-page__section">
          <AccountSection
            email={user?.email ?? null}
            displayName={profile?.display_name ?? null}
          />
        </section>
      </div>
    </>
  );
}
