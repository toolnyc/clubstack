"use client";

import { useState, type ReactNode } from "react";
import { useBreakpoint } from "@/lib/hooks/use-breakpoint";
import { Sidebar } from "./sidebar";
import { BottomTabs } from "./bottom-tabs";

interface AppShellProps {
  children: ReactNode;
  userType?: string | null;
}

function AppShell({ children, userType }: AppShellProps) {
  const breakpoint = useBreakpoint();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const collapsed = isTablet || sidebarCollapsed;

  return (
    <div className="app-shell">
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userType={userType}
        />
      )}

      <div
        className={`app-shell__main ${
          !isMobile
            ? collapsed
              ? "app-shell__main--sidebar-collapsed"
              : "app-shell__main--sidebar"
            : ""
        }`}
      >
        <div className="app-shell__content">{children}</div>
      </div>

      {isMobile && <BottomTabs userType={userType} />}
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
