"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Unlink, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarConnectProps {
  connected: boolean;
  connectedSince?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CalendarConnect({
  connected,
  connectedSince,
  syncStatus,
  lastSyncedAt,
}: CalendarConnectProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/calendar/disconnect", { method: "POST" });
    setDisconnecting(false);
    router.refresh();
  }

  // Revoked state — needs reconnect
  if (connected && syncStatus === "revoked") {
    return (
      <div className="calendar-connect calendar-connect--warning">
        <div className="calendar-connect__info">
          <AlertTriangle size={20} strokeWidth={1.5} />
          <div>
            <p className="calendar-connect__status">Calendar access revoked</p>
            <p className="calendar-connect__since">
              Please reconnect to resume syncing
            </p>
          </div>
        </div>
        <a href="/api/calendar/connect">
          <Button variant="primary" size="sm">
            <RefreshCw size={16} strokeWidth={1.5} />
            Reconnect
          </Button>
        </a>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="calendar-connect calendar-connect--active">
        <div className="calendar-connect__info">
          <Calendar size={20} strokeWidth={1.5} />
          <div>
            <p className="calendar-connect__status">
              Google Calendar connected
            </p>
            <p className="calendar-connect__since">
              {syncStatus === "error" && (
                <span className="calendar-connect__error">
                  Sync error — will retry automatically.{" "}
                </span>
              )}
              {lastSyncedAt
                ? `Last synced ${formatTimeAgo(lastSyncedAt)}`
                : connectedSince &&
                  `Since ${new Date(connectedSince).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          loading={disconnecting}
        >
          <Unlink size={16} strokeWidth={1.5} />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="calendar-connect">
      <div className="calendar-connect__info">
        <Calendar size={20} strokeWidth={1.5} />
        <div>
          <p className="calendar-connect__status">
            Connect your Google Calendar
          </p>
          <p className="calendar-connect__since">
            Sync your availability automatically
          </p>
        </div>
      </div>
      <a href="/api/calendar/connect">
        <Button variant="primary" size="sm">
          Connect
        </Button>
      </a>
    </div>
  );
}

export { CalendarConnect };
export type { CalendarConnectProps };
