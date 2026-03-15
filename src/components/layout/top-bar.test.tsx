import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("renders page title", () => {
    render(<TopBar title="Dashboard" />);
    expect(
      screen.getByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument();
  });

  it("renders action slot when provided", () => {
    render(<TopBar title="Test" actions={<button>Action</button>} />);
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("does not render actions wrapper when no actions", () => {
    const { container } = render(<TopBar title="Test" />);
    expect(container.querySelector(".topbar__actions")).not.toBeInTheDocument();
  });

  it("accepts className prop", () => {
    const { container } = render(<TopBar title="Test" className="custom" />);
    expect(container.firstChild).toHaveClass("custom");
  });
});
