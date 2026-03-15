import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<EmptyState title="Empty" description="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders action button", () => {
    render(
      <EmptyState title="Empty" actionLabel="Add item" onAction={vi.fn()} />
    );
    expect(screen.getByText("Add item")).toBeInTheDocument();
  });

  it("renders as link when actionHref provided", () => {
    render(
      <EmptyState title="Empty" actionLabel="Go" actionHref="/somewhere" />
    );
    const link = screen.getByText("Go").closest("a");
    expect(link).toHaveAttribute("href", "/somewhere");
  });
});
