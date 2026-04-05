import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnboardingPage from "./page";

const mockPush = vi.fn();
const mockCreateProfile = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/auth/actions", () => ({
  createProfile: (...args: unknown[]) => mockCreateProfile(...args),
}));

describe("OnboardingPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockCreateProfile.mockReset();
  });

  it("renders user type selection", () => {
    render(<OnboardingPage />);
    expect(
      screen.getByRole("heading", { name: /how will you use clubstack/i })
    ).toBeInTheDocument();
    expect(screen.getByText("DJ")).toBeInTheDocument();
    expect(screen.getByText("Agency")).toBeInTheDocument();
    expect(screen.getByText("Venue")).toBeInTheDocument();
    expect(screen.getByText("Promoter")).toBeInTheDocument();
  });

  it("shows type descriptions", () => {
    render(<OnboardingPage />);
    expect(
      screen.getByText("Get booked, manage gigs, get paid")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage a roster, book artists, handle contracts")
    ).toBeInTheDocument();
  });

  it("navigates to details step when type selected", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByText("DJ"));

    expect(
      screen.getByRole("heading", { name: /set up your dj account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("shows venue-specific label for venue type", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByText("Venue"));

    expect(screen.getByLabelText("Venue name")).toBeInTheDocument();
  });

  it("can go back from details to type selection", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByText("DJ"));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("DJ")).toBeInTheDocument();
  });

  it("submits profile and redirects DJ to dashboard", async () => {
    const user = userEvent.setup();
    mockCreateProfile.mockResolvedValue({ error: null });

    render(<OnboardingPage />);

    await user.click(screen.getByText("DJ"));
    await user.type(screen.getByLabelText("Name"), "DJ Shadow");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockCreateProfile).toHaveBeenCalledWith("dj", "DJ Shadow");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("submits agency profile and redirects to roster", async () => {
    const user = userEvent.setup();
    mockCreateProfile.mockResolvedValue({ error: null });

    render(<OnboardingPage />);

    await user.click(screen.getByText("Agency"));
    await user.type(screen.getByLabelText("Name"), "Holt Booking");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockCreateProfile).toHaveBeenCalledWith("agency", "Holt Booking");
    expect(mockPush).toHaveBeenCalledWith("/roster");
  });

  it("shows error on profile creation failure", async () => {
    const user = userEvent.setup();
    mockCreateProfile.mockResolvedValue({
      error: "Profile already exists",
    });

    render(<OnboardingPage />);

    await user.click(screen.getByText("DJ"));
    await user.type(screen.getByLabelText("Name"), "DJ Shadow");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Profile already exists")).toBeInTheDocument();
  });
});
