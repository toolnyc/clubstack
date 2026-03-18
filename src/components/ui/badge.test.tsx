import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>PAID</Badge>);
    expect(screen.getByText("PAID")).toBeInTheDocument();
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Badge variant="cyan">Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<Badge variant="error">Failed</Badge>);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
