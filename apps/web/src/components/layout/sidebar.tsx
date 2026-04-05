"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  Users,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  agencyOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Bookings", href: "/bookings", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Roster", href: "/roster", icon: Users, agencyOnly: true },
];

const THEME_OPTIONS: {
  value: Theme;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
}[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userType?: string | null;
}

function Sidebar({ collapsed, onToggle, userType }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.agencyOnly || userType === "agency"
  );

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <Link href="/dashboard" className="sidebar__logo">
          {collapsed ? "C" : "Clubstack"}
        </Link>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon size={20} strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        {!collapsed && (
          <div className="sidebar__theme">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`sidebar__theme-btn ${theme === opt.value ? "sidebar__theme-btn--active" : ""}`}
                aria-label={`${opt.label} theme`}
                aria-pressed={theme === opt.value}
              >
                <opt.icon size={16} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        )}

        <Link href="/settings" className="sidebar__item">
          <Settings size={20} strokeWidth={1.5} />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          className="sidebar__toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight size={20} strokeWidth={1.5} />
          ) : (
            <ChevronsLeft size={20} strokeWidth={1.5} />
          )}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar, NAV_ITEMS };
export type { SidebarProps };
