import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileForm } from "./profile-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSaveDJProfile = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/dj/actions", () => ({
  saveDJProfile: (...args: unknown[]) => mockSaveDJProfile(...args),
}));

describe("ProfileForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockSaveDJProfile.mockReset();
  });

  it("renders create form when no initial data", () => {
    render(<ProfileForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Location/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Min rate/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Max rate/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^SoundCloud/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Instagram/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Bio/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create profile" })
    ).toBeInTheDocument();
  });

  it("renders edit form with initial data", () => {
    render(
      <ProfileForm
        initialData={{
          id: "1",
          user_id: "u1",
          name: "DJ Shadow",
          slug: "dj-shadow",
          rate_min: 500,
          rate_max: 2000,
          soundcloud_url: "https://soundcloud.com/shadow",
          instagram_url: null,
          location: "Brooklyn, NY",
          bio: "Deep house vibes",
          created_at: "",
          updated_at: "",
        }}
      />
    );
    expect(screen.getByDisplayValue("DJ Shadow")).toBeInTheDocument();
    expect(screen.getByDisplayValue("500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brooklyn, NY")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();
  });

  it("renders auto-icon that updates with name", () => {
    render(<ProfileForm />);
    const icon = document.querySelector(".auto-icon");
    expect(icon).toBeInTheDocument();
  });

  it("submits profile and redirects", async () => {
    const user = userEvent.setup();
    mockSaveDJProfile.mockResolvedValue({ data: {}, error: null });

    render(<ProfileForm />);

    await user.type(screen.getByLabelText("Name"), "DJ Shadow");
    await user.click(screen.getByRole("button", { name: "Create profile" }));

    expect(mockSaveDJProfile).toHaveBeenCalledWith({
      name: "DJ Shadow",
      rate_min: null,
      rate_max: null,
      soundcloud_url: null,
      instagram_url: null,
      location: null,
      bio: null,
    });
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("shows error on failure", async () => {
    const user = userEvent.setup();
    mockSaveDJProfile.mockResolvedValue({
      data: null,
      error: "Name is required",
    });

    render(<ProfileForm />);

    await user.type(screen.getByLabelText("Name"), "x");
    await user.click(screen.getByRole("button", { name: "Create profile" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("marks optional fields as optional", () => {
    render(<ProfileForm />);
    const optionalTexts = screen.getAllByText("(optional)");
    expect(optionalTexts.length).toBeGreaterThanOrEqual(5);
  });
});
