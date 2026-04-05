"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  Users,
} from "lucide-react";

interface TabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  agencyOnly?: boolean;
}

const TAB_ITEMS: TabItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Bookings", href: "/bookings", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Roster", href: "/roster", icon: Users, agencyOnly: true },
];

interface BottomTabsProps {
  userType?: string | null;
}

function BottomTabs({ userType }: BottomTabsProps) {
  const pathname = usePathname();
  const visibleItems = TAB_ITEMS.filter(
    (item) => !item.agencyOnly || userType === "agency"
  );

  return (
    <nav className="bottom-tabs" aria-label="Main navigation">
      {visibleItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-tabs__item ${isActive ? "bottom-tabs__item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon size={20} strokeWidth={1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { BottomTabs, TAB_ITEMS };
