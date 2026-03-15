"use client";

import { useState, useTransition } from "react";
import { updatePreference } from "@/lib/notifications/preferences-actions";
import type { NotificationPreference, NotificationType } from "@/types";

const NOTIFICATION_LABELS: Record<
  NotificationType,
  { label: string; description: string }
> = {
  contract_sent: {
    label: "Contract Sent",
    description: "When a contract is ready for your signature",
  },
  contract_signed: {
    label: "Contract Signed",
    description: "When all parties have signed a contract",
  },
  payment_received: {
    label: "Payment Received",
    description: "When a payment has been processed",
  },
  payment_due: {
    label: "Payment Due",
    description: "Reminders for upcoming payment deadlines",
  },
  booking_confirmed: {
    label: "Booking Confirmed",
    description: "When a booking has been confirmed",
  },
  calendar_conflict: {
    label: "Calendar Conflict",
    description: "When a scheduling conflict is detected",
  },
  agency_invite: {
    label: "Agency Invite",
    description: "When an agency invites you to their roster",
  },
};

interface NotificationSettingsProps {
  initialPreferences: NotificationPreference[];
}

function NotificationSettings({
  initialPreferences,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] =
    useState<NotificationPreference[]>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [updatingType, setUpdatingType] = useState<NotificationType | null>(
    null
  );

  function handleToggle(type: NotificationType, currentEnabled: boolean) {
    const newEnabled = !currentEnabled;

    // Optimistic update
    setPreferences((prev) =>
      prev.map((p) =>
        p.notification_type === type ? { ...p, email_enabled: newEnabled } : p
      )
    );
    setUpdatingType(type);

    startTransition(async () => {
      const { error } = await updatePreference(type, newEnabled);
      if (error) {
        // Revert on error
        setPreferences((prev) =>
          prev.map((p) =>
            p.notification_type === type
              ? { ...p, email_enabled: currentEnabled }
              : p
          )
        );
      }
      setUpdatingType(null);
    });
  }

  const sortedTypes = Object.keys(NOTIFICATION_LABELS) as NotificationType[];

  return (
    <div className="notif-settings">
      <h2 className="notif-settings__title">Email Notifications</h2>
      <p className="notif-settings__description">
        Choose which emails you want to receive.
      </p>
      <div className="notif-settings__list">
        {sortedTypes.map((type) => {
          const pref = preferences.find((p) => p.notification_type === type);
          const enabled = pref?.email_enabled ?? true;
          const info = NOTIFICATION_LABELS[type];
          const isUpdating = updatingType === type && isPending;

          return (
            <div key={type} className="notif-settings__item">
              <div className="notif-settings__item-text">
                <span className="notif-settings__item-label">{info.label}</span>
                <span className="notif-settings__item-description">
                  {info.description}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${info.label} email notifications`}
                className={`notif-settings__toggle ${enabled ? "notif-settings__toggle--on" : ""}`}
                disabled={isUpdating}
                onClick={() => handleToggle(type, enabled)}
              >
                <span className="notif-settings__toggle-thumb" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { NotificationSettings, NOTIFICATION_LABELS };
export type { NotificationSettingsProps };
