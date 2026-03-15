"use client";

import { useSyncExternalStore } from "react";

type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(): Breakpoint {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot(): Breakpoint {
  return getBreakpoint();
}

function getServerSnapshot(): Breakpoint {
  return "desktop";
}

function useBreakpoint() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { useBreakpoint };
export type { Breakpoint };
