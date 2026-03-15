"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarConnectProps {
  connected: boolean;
  connectedSince?: string;
}

function CalendarConnect({ connected, connectedSince }: CalendarConnectProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/calendar/disconnect", { method: "POST" });
    setDisconnecting(false);
    router.refresh();
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
            {connectedSince && (
              <p className="calendar-connect__since">
                Since{" "}
                {new Date(connectedSince).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
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
