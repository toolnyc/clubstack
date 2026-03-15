import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "./page";

const mockSignInWithOtp = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockSignInWithOtp.mockReset();
  });

  it("renders sign-in form", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: /sign in to clubstack/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send sign-in link/i })
    ).toBeInTheDocument();
  });

  it("submits email and shows success message", async () => {
    const user = userEvent.setup();
    mockSignInWithOtp.mockResolvedValue({ error: null });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /send sign-in link/i })
    );

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: {
        emailRedirectTo: expect.stringContaining("/auth/callback"),
      },
    });

    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows error message on auth failure", async () => {
    const user = userEvent.setup();
    mockSignInWithOtp.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /send sign-in link/i })
    );

    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
  });

  it("allows using a different email after sending", async () => {
    const user = userEvent.setup();
    mockSignInWithOtp.mockResolvedValue({ error: null });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /send sign-in link/i })
    );

    expect(screen.getByText(/check your email/i)).toBeInTheDocument();

    await user.click(screen.getByText(/use a different email/i));

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
