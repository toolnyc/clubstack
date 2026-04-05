import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/lib/hooks/use-breakpoint", () => ({
  useBreakpoint: () => "desktop",
}));

describe("AppShell", () => {
  it("renders children", () => {
    render(<AppShell>Page content</AppShell>);
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders sidebar on desktop", () => {
    render(<AppShell>Content</AppShell>);
    expect(screen.getByText("Clubstack")).toBeInTheDocument();
  });

  it("renders navigation landmark", () => {
    render(<AppShell>Content</AppShell>);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
