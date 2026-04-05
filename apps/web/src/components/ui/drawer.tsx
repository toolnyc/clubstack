"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useBreakpoint } from "@/lib/hooks/use-breakpoint";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function Drawer({
  open,
  onClose,
  title,
  children,
  className = "",
}: DrawerProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer__overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className={`drawer ${isMobile ? "drawer--bottom" : "drawer--right"} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title || "Drawer"}
      >
        <div className="drawer__header">
          {title && <h2 className="drawer__title">{title}</h2>}
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}

export { Drawer };
export type { DrawerProps };
