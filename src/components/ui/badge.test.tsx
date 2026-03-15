import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>PAID</Badge>);
    expect(screen.getByText("PAID")).toBeInTheDocument();
  });

  it("defaults to default variant", () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild).toHaveClass("badge--default");
  });

  it("applies variant class", () => {
    const { container } = render(<Badge variant="cyan">Active</Badge>);
    expect(container.firstChild).toHaveClass("badge--cyan");
  });

  it("applies error variant", () => {
    const { container } = render(<Badge variant="error">Failed</Badge>);
    expect(container.firstChild).toHaveClass("badge--error");
  });

  it("accepts className prop", () => {
    const { container } = render(<Badge className="custom">Tag</Badge>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
