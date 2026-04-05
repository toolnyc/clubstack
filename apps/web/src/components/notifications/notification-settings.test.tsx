import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationSettings } from "./notification-settings";
import type { NotificationPreference } from "@/types";

// Mock the server action — it lives outside the component boundary
vi.mock("@/lib/notifications/preferences-actions", () => ({
  updatePreference: vi.fn().mockResolvedValue({ error: null }),
}));

const makePreference = (
  type: NotificationPreference["notification_type"],
  emailEnabled = true
): NotificationPreference => ({
  id: `pref-${type}`,
  user_id: "user-1",
  notification_type: type,
  email_enabled: emailEnabled,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

const defaultPreferences: NotificationPreference[] = [
  makePreference("contract_sent", true),
  makePreference("contract_signed", true),
  makePreference("payment_received", true),
  makePreference("payment_due", false),
  makePreference("booking_confirmed", true),
  makePreference("calendar_conflict", true),
  makePreference("agency_invite", true),
];

describe("NotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the section heading", () => {
    render(<NotificationSettings initialPreferences={defaultPreferences} />);
    expect(screen.getByText("Email Notifications")).toBeInTheDocument();
  });

  it("renders all notification types", () => {
    render(<NotificationSettings initialPreferences={defaultPreferences} />);
    expect(screen.getByText("Contract Sent")).toBeInTheDocument();
    expect(screen.getByText("Contract Signed")).toBeInTheDocument();
    expect(screen.getByText("Payment Received")).toBeInTheDocument();
    expect(screen.getByText("Payment Due")).toBeInTheDocument();
    expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Calendar Conflict")).toBeInTheDocument();
    expect(screen.getByText("Agency Invite")).toBeInTheDocument();
  });

  it("renders toggle switches with correct checked state", () => {
    render(<NotificationSettings initialPreferences={defaultPreferences} />);

    const paymentDueToggle = screen.getByRole("switch", {
      name: /payment due/i,
    });
    expect(paymentDueToggle).toHaveAttribute("aria-checked", "false");

    const contractSentToggle = screen.getByRole("switch", {
      name: /contract sent/i,
    });
    expect(contractSentToggle).toHaveAttribute("aria-checked", "true");
  });

  it("defaults missing preferences to enabled", () => {
    render(<NotificationSettings initialPreferences={[]} />);

    const toggles = screen.getAllByRole("switch");
    for (const toggle of toggles) {
      expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  });

  it("calls updatePreference with new value when toggled", async () => {
    const { updatePreference } =
      await import("@/lib/notifications/preferences-actions");

    render(<NotificationSettings initialPreferences={defaultPreferences} />);

    const paymentDueToggle = screen.getByRole("switch", {
      name: /payment due/i,
    });

    fireEvent.click(paymentDueToggle);

    expect(updatePreference).toHaveBeenCalledWith("payment_due", true);
  });

  it("performs optimistic update immediately on toggle", () => {
    render(<NotificationSettings initialPreferences={defaultPreferences} />);

    const paymentDueToggle = screen.getByRole("switch", {
      name: /payment due/i,
    });

    expect(paymentDueToggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(paymentDueToggle);

    expect(paymentDueToggle).toHaveAttribute("aria-checked", "true");
  });

  it("reverts optimistic update if server action returns error", async () => {
    const { updatePreference } =
      await import("@/lib/notifications/preferences-actions");
    vi.mocked(updatePreference).mockResolvedValueOnce({ error: "DB error" });

    render(<NotificationSettings initialPreferences={defaultPreferences} />);

    const paymentDueToggle = screen.getByRole("switch", {
      name: /payment due/i,
    });

    fireEvent.click(paymentDueToggle);
    // Optimistic: flipped to true
    expect(paymentDueToggle).toHaveAttribute("aria-checked", "true");

    // After the async action resolves, state reverts
    await vi.waitFor(() => {
      expect(paymentDueToggle).toHaveAttribute("aria-checked", "false");
    });
  });
});
