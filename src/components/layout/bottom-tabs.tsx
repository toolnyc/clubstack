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
}

const TAB_ITEMS: TabItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Bookings", href: "/bookings", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Roster", href: "/roster", icon: Users },
];

function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="bottom-tabs" aria-label="Main navigation">
      {TAB_ITEMS.map((item) => {
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
