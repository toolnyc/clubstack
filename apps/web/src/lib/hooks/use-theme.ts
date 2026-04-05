"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

function getSnapshot(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

  return { theme, setTheme, resolvedTheme };
}

export { useTheme };
export type { Theme };
