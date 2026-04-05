import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("applies default variant class when no variant is specified", () => {
    const { container } = render(<Badge>PAID</Badge>);
    expect(container.firstChild).toHaveClass("badge--default");
  });

  it.each(["cyan", "neon", "error"] as const)(
    "applies badge--%s class for variant=%s",
    (variant) => {
      const { container } = render(<Badge variant={variant}>Label</Badge>);
      expect(container.firstChild).toHaveClass(`badge--${variant}`);
    }
  );

  it("merges custom className without overriding variant class", () => {
    const { container } = render(
      <Badge variant="cyan" className="ml-2">
        Active
      </Badge>
    );
    expect(container.firstChild).toHaveClass("badge--cyan", "ml-2");
  });

  it("renders children", () => {
    render(<Badge>OVERDUE</Badge>);
    expect(screen.getByText("OVERDUE")).toBeInTheDocument();
  });
});
